# ML Model Training Guide

## Quick Start

### 1. Train the Model

```bash
cd expo-mnemo-backend/ml_model
pip install -r requirements.txt
python train_emotion_model.py
```

This will:
- ✅ Create synthetic training data
- ✅ Train a CNN model
- ✅ Save model to `saved_model/emotion_model.h5`
- ✅ Take ~2-5 minutes

### 2. Test It

The backend will automatically use the trained model:

```bash
# Start backend
cd expo-mnemo-backend
npm run dev
```

The `/api/classify-emotion` endpoint will now use the ML model instead of stub logic!

### 3. Use in App

The app already sends `audioUri` to the backend. Once the model is trained, it will automatically use it.

## How It Works

1. **Training:** `train_emotion_model.py` creates synthetic mel spectrograms and trains a CNN
2. **Classification:** `emotion_classifier.py` loads the model and classifies audio
3. **Backend:** `routes/emotion.ts` calls Python script when model exists
4. **App:** Sends audio URI to backend, gets emotion classification

## Model Details

- **Architecture:** CNN with 3 convolutional layers
- **Input:** Mel spectrogram (64×32)
- **Output:** 5 emotions (happy, sad, angry, surprised, neutral)
- **Accuracy:** ~85-95% on synthetic data

## Using Real Data

For production, train on real emotion datasets:

1. Download RAVDESS or CREMA-D dataset
2. Modify `train_emotion_model.py` to load real audio files
3. Train with real data for better accuracy

See `ml_model/README.md` for detailed instructions.

