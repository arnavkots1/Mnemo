"""
Emotion Detection Model Training Script

Trains a simple CNN-based model for emotion classification from audio.
Uses mel spectrograms as input features.

Note: This uses a synthetic dataset for demonstration. In production,
you would use a real emotion dataset like RAVDESS, CREMA-D, or EmoDB.
"""

import numpy as np
import librosa
import os
import json
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import warnings
warnings.filterwarnings('ignore')

# Model configuration
SAMPLE_RATE = 16000
DURATION = 1.0  # 1 second clips
N_MELS = 64
N_FFT = 2048
HOP_LENGTH = 512
N_FRAMES = int(SAMPLE_RATE * DURATION / HOP_LENGTH) + 1

EMOTIONS = ['happy', 'sad', 'angry', 'surprised', 'neutral']
N_CLASSES = len(EMOTIONS)

def create_synthetic_audio_features(emotion: str, num_samples: int = 100):
    """
    Create synthetic mel spectrogram features for training.
    
    In production, this would load real audio files and extract features.
    For now, we create synthetic features that mimic different emotions:
    - Happy: Higher frequency content, more energy
    - Sad: Lower frequency content, less energy
    - Angry: High energy, wide frequency range
    - Surprised: Sudden energy spikes
    - Neutral: Balanced features
    """
    features = []
    
    for _ in range(num_samples):
        # Create base mel spectrogram (64 mel bins x ~32 time frames)
        mel_spec = np.zeros((N_MELS, N_FRAMES))
        
        if emotion == 'happy':
            # Higher frequencies, more energy
            mel_spec[30:50, :] = np.random.uniform(0.5, 1.0, (20, N_FRAMES))
            mel_spec[10:30, :] = np.random.uniform(0.3, 0.7, (20, N_FRAMES))
        elif emotion == 'sad':
            # Lower frequencies, less energy
            mel_spec[0:20, :] = np.random.uniform(0.2, 0.5, (20, N_FRAMES))
            mel_spec[20:40, :] = np.random.uniform(0.1, 0.3, (20, N_FRAMES))
        elif emotion == 'angry':
            # High energy across frequencies
            mel_spec[:, :] = np.random.uniform(0.4, 0.9, (N_MELS, N_FRAMES))
        elif emotion == 'surprised':
            # Sudden spikes
            mel_spec[:, :] = np.random.uniform(0.1, 0.4, (N_MELS, N_FRAMES))
            # Add random spikes
            spike_indices = np.random.choice(N_FRAMES, size=5, replace=False)
            mel_spec[:, spike_indices] = np.random.uniform(0.7, 1.0, (N_MELS, 5))
        else:  # neutral
            # Balanced
            mel_spec[:, :] = np.random.uniform(0.2, 0.6, (N_MELS, N_FRAMES))
        
        # Add some noise
        mel_spec += np.random.normal(0, 0.05, mel_spec.shape)
        mel_spec = np.clip(mel_spec, 0, 1)
        
        features.append(mel_spec)
    
    return np.array(features)

def extract_features_from_audio(audio_path: str):
    """
    Extract mel spectrogram from real audio file.
    Use this function when you have real audio data.
    """
    try:
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
        
        return mel_spec_db
    except Exception as e:
        print(f"Error processing {audio_path}: {e}")
        return None

def create_model():
    """Create CNN model for emotion classification"""
    model = keras.Sequential([
        # Input: (N_MELS, N_FRAMES)
        layers.Input(shape=(N_MELS, N_FRAMES, 1)),
        
        # Convolutional layers
        layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        
        layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        
        layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        
        # Global pooling
        layers.GlobalAveragePooling2D(),
        
        # Dense layers
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.3),
        
        # Output layer
        layers.Dense(N_CLASSES, activation='softmax')
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def train_model():
    """Train the emotion detection model"""
    print("🎵 Creating synthetic dataset...")
    
    # Create synthetic dataset
    X = []
    y = []
    
    for emotion_idx, emotion in enumerate(EMOTIONS):
        print(f"  Generating {emotion} samples...")
        features = create_synthetic_audio_features(emotion, num_samples=200)
        X.append(features)
        y.extend([emotion_idx] * len(features))
    
    X = np.concatenate(X, axis=0)
    y = np.array(y)
    
    # Reshape for CNN: (samples, height, width, channels)
    X = X[..., np.newaxis]
    
    print(f"✅ Dataset created: {X.shape[0]} samples")
    print(f"   Shape: {X.shape}")
    print(f"   Classes: {EMOTIONS}")
    
    # Split dataset
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"\n📊 Training set: {X_train.shape[0]} samples")
    print(f"   Test set: {X_test.shape[0]} samples")
    
    # Create model
    print("\n🧠 Creating model...")
    model = create_model()
    model.summary()
    
    # Train model
    print("\n🚀 Training model...")
    history = model.fit(
        X_train, y_train,
        batch_size=32,
        epochs=20,
        validation_data=(X_test, y_test),
        verbose=1
    )
    
    # Evaluate
    print("\n📈 Evaluating model...")
    test_loss, test_accuracy = model.evaluate(X_test, y_test, verbose=0)
    print(f"   Test Accuracy: {test_accuracy:.2%}")
    
    # Save model
    model_dir = Path(__file__).parent / 'saved_model'
    model_dir.mkdir(exist_ok=True)
    
    model_path = model_dir / 'emotion_model.h5'
    model.save(str(model_path))
    print(f"\n💾 Model saved to: {model_path}")
    
    # Save metadata
    metadata = {
        'emotions': EMOTIONS,
        'sample_rate': SAMPLE_RATE,
        'duration': DURATION,
        'n_mels': N_MELS,
        'n_fft': N_FFT,
        'hop_length': HOP_LENGTH,
        'test_accuracy': float(test_accuracy)
    }
    
    metadata_path = model_dir / 'metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"💾 Metadata saved to: {metadata_path}")
    
    return model, metadata

if __name__ == '__main__':
    print("=" * 60)
    print("Emotion Detection Model Training")
    print("=" * 60)
    
    model, metadata = train_model()
    
    print("\n" + "=" * 60)
    print("✅ Training complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. The model is saved in ml_model/saved_model/")
    print("2. Update backend to load and use this model")
    print("3. For production, train on real emotion datasets")

