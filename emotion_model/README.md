# Audio Emotion Classification Model

Lightweight PyTorch model for detecting emotions in audio, designed for on-device inference via Core ML in the Mnemo iOS app.

## Overview

This model classifies short audio clips (1-2 seconds) into 5 emotion categories:
- `happy`
- `sad`
- `angry`
- `surprised`
- `neutral`

## Architecture

- **Input**: Log-mel spectrogram (64 mel bins × 100 time frames)
- **Architecture**: 1D CNN with 3 convolutional blocks + global average pooling + FC layers
- **Output**: Logits for 5 emotion classes
- **Model Size**: ~50K parameters (lightweight for mobile)

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Prepare your dataset (see `data/README.md`):
   - Place audio files in `data/audio/`
   - Create `data/labels.csv` with columns: `path,label`

## Training

Basic training:
```bash
python train.py --data_dir data --epochs 50 --batch_size 32
```

With data augmentation:
```bash
python train.py --data_dir data --epochs 50 --batch_size 32 --use_augmentation
```

All options:
```bash
python train.py \
    --data_dir data \
    --csv_path data/labels.csv \
    --epochs 50 \
    --batch_size 32 \
    --lr 0.001 \
    --val_split 0.2 \
    --n_mels 64 \
    --time_steps 100 \
    --sample_rate 16000 \
    --use_augmentation \
    --early_stopping_patience 5 \
    --output_dir outputs
```

## Outputs

After training, the following files are saved to `outputs/`:

- `best_model.pth` - PyTorch checkpoint
- `emotion_classifier.onnx` - ONNX model
- `EmotionClassifier.mlmodel` - Core ML model (for iOS)
- `confusion_matrix.png` - Validation confusion matrix
- `training_history.json` - Training metrics
- `model_config.json` - Model configuration

## Core ML Model Spec

### Input
- **Name**: `log_mel_spectrogram`
- **Type**: Float32
- **Shape**: `[1, 64, 100]` (batch, n_mels, time_steps)
- **Description**: Log-mel spectrogram extracted from ~1 second of 16 kHz mono audio

### Output
- **Name**: `emotion_logits`
- **Type**: Float32
- **Shape**: `[1, 5]` (batch, n_classes)
- **Description**: Logits for emotion classes (apply softmax to get probabilities)

### Emotion Classes (in order)
1. `happy`
2. `sad`
3. `angry`
4. `surprised`
5. `neutral`

## Integration with iOS

1. Copy `EmotionClassifier.mlmodel` to your Xcode project
2. In `EmotionalCaptureService.swift`, replace the random emotion detection with:
   ```swift
   func classifyEmotion(from buffer: AVAudioPCMBuffer, at time: AVAudioTime) -> Emotion? {
       // Extract log-mel spectrogram from buffer
       let spectrogram = extractLogMelSpectrogram(from: buffer)
       
       // Run Core ML model
       let model = try! EmotionClassifier(configuration: MLModelConfiguration())
       let input = EmotionClassifierInput(log_mel_spectrogram: spectrogram)
       let output = try! model.prediction(from: input)
       
       // Get probabilities and return most likely emotion
       let probabilities = output.emotion_logits
       let maxIdx = probabilities.argmax()
       return Emotion.fromIndex(maxIdx)
   }
   ```

## Preprocessing Requirements

For inference in iOS, audio must be preprocessed to match training:

1. **Resample** to 16 kHz
2. **Convert to mono**
3. **Extract log-mel spectrogram**:
   - 64 mel filter banks
   - 2048 FFT window
   - 512 hop length
   - 100 time frames (~1 second)
4. **Normalize** to match training distribution

## Model Performance

Expected performance (varies by dataset):
- **Accuracy**: 70-85% on balanced validation set
- **Inference Time**: <10ms on iPhone (estimated)
- **Model Size**: ~200 KB

## Tips

- **Dataset Quality**: More diverse, balanced datasets yield better models
- **Augmentation**: Helps with generalization, especially with small datasets
- **Hyperparameters**: Adjust `n_mels` and `time_steps` based on your audio characteristics
- **Early Stopping**: Prevents overfitting; adjust patience based on your dataset size

## Troubleshooting

**ONNX export fails**: Ensure PyTorch and ONNX versions are compatible
**Core ML conversion fails**: Check ONNX model is valid, ensure coremltools version >= 7.0
**Low accuracy**: Check dataset balance, try more augmentation, increase model capacity
**iOS inference slow**: Reduce `n_mels` or `time_steps`, use quantization

## License

Same as Mnemo iOS app.

