# Emotion Detection ML Model

This directory contains the machine learning model for emotion detection from audio.

## Overview

The model uses a CNN (Convolutional Neural Network) architecture to classify emotions from audio mel spectrograms. It supports 5 emotion classes:
- `happy`
- `sad`
- `angry`
- `surprised`
- `neutral`

## Setup

### 1. Install Python Dependencies

```bash
cd expo-mnemo-backend/ml_model
pip install -r requirements.txt
```

**Note:** You may need Python 3.8+ and TensorFlow 2.13+.

### 2. Train the Model

The training script creates a synthetic dataset for demonstration purposes. In production, you would use real emotion datasets like:
- RAVDESS (Ryerson Audio-Visual Database of Emotional Speech and Song)
- CREMA-D (Crowd-sourced Emotional Multimodal Actors Dataset)
- EmoDB (Berlin Database of Emotional Speech)

```bash
python train_emotion_model.py
```

This will:
1. Generate synthetic audio features (mel spectrograms)
2. Train a CNN model
3. Save the model to `saved_model/emotion_model.h5`
4. Save metadata to `saved_model/metadata.json`

**Training time:** ~2-5 minutes on CPU

### 3. Test the Model

```bash
python classify_audio.py <path_to_audio_file>
```

This will output JSON with emotion and confidence:
```json
{
  "emotion": "happy",
  "confidence": 0.85
}
```

## Model Architecture

- **Input:** Mel spectrogram (64 mel bins × ~32 time frames)
- **Architecture:** 
  - 3 Conv2D layers with BatchNorm and MaxPooling
  - GlobalAveragePooling2D
  - 2 Dense layers with Dropout
  - Softmax output layer
- **Output:** 5 emotion probabilities

## Integration with Backend

The backend automatically uses the trained model if it exists:

1. **Model available:** Uses ML model for classification
2. **Model not found:** Falls back to stub classifier

The backend route (`/api/classify-emotion`) will:
- Check if `saved_model/emotion_model.h5` exists
- If yes, call Python script to classify audio
- If no, use stub implementation

## Using Real Datasets

To train on real emotion datasets:

1. **Download a dataset** (e.g., RAVDESS)
2. **Extract audio files** organized by emotion
3. **Modify `train_emotion_model.py`:**
   - Replace `create_synthetic_audio_features()` with real audio loading
   - Use `extract_features_from_audio()` for each file
   - Organize by emotion labels

Example structure:
```
dataset/
  happy/
    audio1.wav
    audio2.wav
  sad/
    audio1.wav
    ...
```

## Model Performance

**Current (Synthetic Data):**
- Test Accuracy: ~85-95% (on synthetic data)
- Note: This is on synthetic data, real performance will vary

**Expected (Real Data):**
- With RAVDESS: ~60-75% accuracy
- With CREMA-D: ~65-80% accuracy
- Can be improved with:
  - More training data
  - Data augmentation
  - Transfer learning
  - Ensemble methods

## Next Steps

1. **Collect real audio data** with emotion labels
2. **Train on real dataset** for better accuracy
3. **Fine-tune hyperparameters** (learning rate, architecture)
4. **Add data augmentation** (pitch shift, time stretch, noise)
5. **Deploy model** to production (TensorFlow Serving, ONNX Runtime)

## Files

- `train_emotion_model.py` - Training script
- `emotion_classifier.py` - Model loading and classification
- `classify_audio.py` - Standalone classification script
- `requirements.txt` - Python dependencies
- `saved_model/` - Trained model directory (created after training)

