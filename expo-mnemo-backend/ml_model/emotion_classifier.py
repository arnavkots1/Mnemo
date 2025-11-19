"""
Emotion Classifier - Loads trained model and classifies audio

This module loads the trained emotion detection model and provides
a function to classify emotions from audio files.
"""

import numpy as np
import librosa
import json
from pathlib import Path
import tensorflow as tf
from typing import Dict, Tuple, Optional

# Model configuration (must match training)
SAMPLE_RATE = 16000
DURATION = 1.0
N_MELS = 64
N_FFT = 2048
HOP_LENGTH = 512
N_FRAMES = int(SAMPLE_RATE * DURATION / HOP_LENGTH) + 1

EMOTIONS = ['happy', 'sad', 'angry', 'surprised', 'neutral']

class EmotionClassifier:
    """Emotion classifier using trained TensorFlow model"""
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize classifier with trained model
        
        Args:
            model_path: Path to saved model file. If None, looks for default path.
        """
        if model_path is None:
            model_dir = Path(__file__).parent / 'saved_model'
            model_path = model_dir / 'emotion_model.h5'
        
        self.model_path = Path(model_path)
        self.model = None
        self.metadata = None
        
        if self.model_path.exists():
            self.load_model()
        else:
            print(f"⚠️  Model not found at {model_path}")
            print("   Using stub classifier instead")
    
    def load_model(self):
        """Load trained model and metadata"""
        try:
            print(f"📦 Loading model from {self.model_path}...")
            self.model = tf.keras.models.load_model(str(self.model_path))
            
            # Load metadata
            metadata_path = self.model_path.parent / 'metadata.json'
            if metadata_path.exists():
                with open(metadata_path, 'r') as f:
                    self.metadata = json.load(f)
                print(f"✅ Model loaded successfully")
                print(f"   Test accuracy: {self.metadata.get('test_accuracy', 'N/A'):.2%}")
            else:
                print("⚠️  Metadata not found")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            self.model = None
    
    def extract_features(self, audio_path: str) -> Optional[np.ndarray]:
        """
        Extract mel spectrogram features from audio file
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Mel spectrogram features or None if error
        """
        try:
            # Load audio
            y, sr = librosa.load(audio_path, sr=SAMPLE_RATE, duration=DURATION)
            
            # Pad or trim to exact duration
            target_length = int(SAMPLE_RATE * DURATION)
            if len(y) < target_length:
                y = np.pad(y, (0, target_length - len(y)))
            else:
                y = y[:target_length]
            
            # Extract mel spectrogram
            mel_spec = librosa.feature.melspectrogram(
                y=y,
                sr=sr,
                n_mels=N_MELS,
                n_fft=N_FFT,
                hop_length=HOP_LENGTH
            )
            
            # Convert to log scale
            mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
            
            # Normalize to [0, 1]
            mel_spec_db = (mel_spec_db - mel_spec_db.min()) / (mel_spec_db.max() - mel_spec_db.min() + 1e-8)
            
            # Reshape for model: (1, height, width, channels)
            mel_spec_db = mel_spec_db[np.newaxis, ..., np.newaxis]
            
            return mel_spec_db
        except Exception as e:
            print(f"Error extracting features from {audio_path}: {e}")
            return None
    
    def classify(self, audio_path: str) -> Tuple[str, float]:
        """
        Classify emotion from audio file
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Tuple of (emotion, confidence)
        """
        if self.model is None:
            # Fallback to stub
            return self._stub_classify()
        
        features = self.extract_features(audio_path)
        if features is None:
            return self._stub_classify()
        
        # Predict
        predictions = self.model.predict(features, verbose=0)
        emotion_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][emotion_idx])
        
        emotion = EMOTIONS[emotion_idx]
        
        return emotion, confidence
    
    def _stub_classify(self) -> Tuple[str, float]:
        """Fallback stub classifier"""
        emotion = np.random.choice(EMOTIONS)
        confidence = 0.6 + np.random.random() * 0.3
        return emotion, confidence

# Global classifier instance
_classifier: Optional[EmotionClassifier] = None

def get_classifier() -> EmotionClassifier:
    """Get or create global classifier instance"""
    global _classifier
    if _classifier is None:
        _classifier = EmotionClassifier()
    return _classifier

