"""
Dataset loader for audio emotion classification.

Handles loading audio files, preprocessing, and data augmentation.
"""

import os
from pathlib import Path
from typing import Optional, Tuple

import torch
from torch.utils.data import Dataset
import numpy as np
import pandas as pd
import librosa
import soundfile as sf


class AudioEmotionDataset(Dataset):
    """
    Dataset for audio emotion classification.
    
    Loads audio files, converts to log-mel spectrograms,
    and applies optional data augmentation.
    """
    
    def __init__(
        self,
        csv_path: str,
        data_dir: str,
        n_mels: int = 64,
        time_steps: int = 100,
        sample_rate: int = 16000,
        use_augmentation: bool = False
    ):
        """
        Args:
            csv_path: Path to CSV file with columns (path, label)
            data_dir: Root directory containing audio files
            n_mels: Number of mel filter banks
            time_steps: Number of time frames in spectrogram
            sample_rate: Target sample rate (will resample if needed)
            use_augmentation: Whether to apply data augmentation
        """
        self.data_dir = Path(data_dir)
        self.n_mels = n_mels
        self.time_steps = time_steps
        self.sample_rate = sample_rate
        self.use_augmentation = use_augmentation
        
        # Load labels CSV
        df = pd.read_csv(csv_path)
        self.samples = df.to_dict('records')
        
        # Emotion class mapping
        self.emotion_classes = ['happy', 'sad', 'angry', 'surprised', 'neutral']
        self.emotion_to_idx = {emotion: idx for idx, emotion in enumerate(self.emotion_classes)}
        
        print(f"Loaded {len(self.samples)} samples")
        print(f"Class distribution:")
        for emotion in self.emotion_classes:
            count = sum(1 for s in self.samples if s['label'] == emotion)
            print(f"  {emotion}: {count}")
    
    def __len__(self) -> int:
        return len(self.samples)
    
    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        """
        Get a sample.
        
        Returns:
            spectrogram: Log-mel spectrogram tensor (n_mels, time_steps)
            label: Emotion class index
        """
        sample = self.samples[idx]
        audio_path = self.data_dir / sample['path']
        label = self.emotion_to_idx[sample['label']]
        
        # Load and preprocess audio
        spectrogram = self._load_and_preprocess(audio_path)
        
        # Apply augmentation if training
        if self.use_augmentation:
            spectrogram = self._augment(spectrogram)
        
        # Convert to tensor
        spectrogram = torch.FloatTensor(spectrogram)
        
        return spectrogram, label
    
    def _load_and_preprocess(self, audio_path: Path) -> np.ndarray:
        """
        Load audio file and convert to log-mel spectrogram.
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Log-mel spectrogram (n_mels, time_steps)
        """
        # Load audio
        try:
            audio, sr = librosa.load(str(audio_path), sr=self.sample_rate, mono=True)
        except Exception as e:
            print(f"Error loading {audio_path}: {e}")
            # Return zeros if file can't be loaded
            audio = np.zeros(self.sample_rate * 2)  # 2 seconds of silence
        
        # Ensure minimum length (pad if needed)
        min_length = int(self.sample_rate * 1.0)  # 1 second minimum
        if len(audio) < min_length:
            audio = np.pad(audio, (0, min_length - len(audio)), mode='constant')
        
        # Trim or pad to target duration
        target_length = int(self.sample_rate * (self.time_steps * 0.01))  # time_steps * 10ms per frame
        if len(audio) > target_length:
            # Trim from center
            start = (len(audio) - target_length) // 2
            audio = audio[start:start + target_length]
        else:
            # Pad with zeros
            audio = np.pad(audio, (0, target_length - len(audio)), mode='constant')
        
        # Normalize audio
        audio = librosa.util.normalize(audio)
        
        # Extract log-mel spectrogram
        mel_spec = librosa.feature.melspectrogram(
            y=audio,
            sr=self.sample_rate,
            n_mels=self.n_mels,
            n_fft=2048,
            hop_length=512,
            fmin=0,
            fmax=self.sample_rate // 2
        )
        
        # Convert to log scale
        log_mel_spec = librosa.power_to_db(mel_spec, ref=np.max)
        
        # Ensure correct shape (n_mels, time_steps)
        if log_mel_spec.shape[1] < self.time_steps:
            # Pad time dimension
            pad_width = self.time_steps - log_mel_spec.shape[1]
            log_mel_spec = np.pad(log_mel_spec, ((0, 0), (0, pad_width)), mode='constant')
        elif log_mel_spec.shape[1] > self.time_steps:
            # Trim time dimension
            log_mel_spec = log_mel_spec[:, :self.time_steps]
        
        return log_mel_spec
    
    def _augment(self, spectrogram: np.ndarray) -> np.ndarray:
        """
        Apply data augmentation to spectrogram.
        
        Args:
            spectrogram: Input spectrogram
            
        Returns:
            Augmented spectrogram
        """
        # Add small amount of noise
        noise = np.random.normal(0, 0.01, spectrogram.shape)
        spectrogram = spectrogram + noise
        
        # Random gain (brightness adjustment)
        gain = np.random.uniform(0.9, 1.1)
        spectrogram = spectrogram * gain
        
        # Time masking (randomly mask time frames)
        if np.random.random() > 0.5:
            mask_width = np.random.randint(1, 5)
            mask_start = np.random.randint(0, max(1, self.time_steps - mask_width))
            spectrogram[:, mask_start:mask_start + mask_width] = 0
        
        # Frequency masking (randomly mask mel bins)
        if np.random.random() > 0.5:
            mask_height = np.random.randint(1, 8)
            mask_start = np.random.randint(0, max(1, self.n_mels - mask_height))
            spectrogram[mask_start:mask_start + mask_height, :] = 0
        
        return spectrogram

