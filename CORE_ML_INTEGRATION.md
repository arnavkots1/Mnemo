# Core ML Emotion Model Integration

## Overview

The EmotionalCaptureService now uses a Core ML model for real-time emotion detection in audio. This replaces the previous random detection simulation.

## Model Requirements

### Model File
- **Name**: `EmotionAudioClassifier.mlmodel` (or `.mlmodelc` compiled version)
- **Location**: Add to Xcode project bundle
- **Input**: Log-mel spectrogram `[1, 64, 100]` (batch, n_mels, time_steps)
- **Output**: Emotion logits `[1, 5]` (batch, n_classes)

### Emotion Classes (in order)
1. `happy`
2. `sad`
3. `angry`
4. `surprised`
5. `neutral`

## Architecture

### Audio Processing Pipeline

```
AVAudioEngine (16 kHz mono)
    ↓
Circular Buffer (last 10 seconds)
    ↓
Extract 1-second window every 0.5 seconds
    ↓
AudioPreprocessor
    ├─ Resample to 16 kHz (if needed)
    ├─ Convert to mono
    ├─ Extract log-mel spectrogram (64 × 100)
    └─ Convert to MLMultiArray
    ↓
Core ML Model Inference (background queue)
    ↓
Apply Softmax → Get Probabilities
    ↓
Check Threshold → Trigger Event
```

### Audio Buffer Segmentation

**Window Size**: 1 second (16,000 samples at 16 kHz)
**Overlap**: 0.5 seconds (50% overlap)
**Classification Frequency**: Every 0.5 seconds

**Example Timeline**:
```
Time:  0s    0.5s   1.0s   1.5s   2.0s
       |-----|-----|-----|-----|
Window: [----1----]
              [----2----]
                    [----3----]
                          [----4----]
```

Each window is processed independently, allowing continuous monitoring.

### Result Smoothing

To avoid false positives and duplicate events:

1. **Consecutive Detections**: Requires 2 consecutive detections before triggering
   - Configurable via `EmotionModelConfig.consecutiveDetectionsRequired`

2. **Cooldown Period**: 3 seconds after event before next detection
   - Configurable via `EmotionModelConfig.eventCooldownPeriod`
   - Prevents multiple events from same continuous emotion (e.g., long laugh)

3. **Confidence Threshold**: Only emotions above threshold trigger events
   - Default: 0.7 (70% confidence)
   - Configurable via `EmotionModelConfig.detectionThreshold`

## Implementation Details

### AudioPreprocessor

**Responsibilities**:
- Converts PCM audio to log-mel spectrogram
- Handles resampling, mono conversion
- Extracts mel spectrogram using FFT
- Normalizes and pads/trims to fixed dimensions

**Key Methods**:
- `preprocessAudio(_:)` - Main preprocessing function
- `extractLogMelSpectrogram(from:)` - Core spectrogram extraction
- `computeFFT(_:)` - FFT computation using Accelerate framework

### EmotionalCaptureService

**Classification Flow**:
1. Audio buffers collected continuously (1-second frames)
2. Timer triggers classification every 0.5 seconds
3. Latest 1-second window extracted
4. Preprocessed to log-mel spectrogram
5. Core ML inference on background queue
6. Results smoothed and threshold checked
7. Event triggered if conditions met

**Performance Considerations**:
- Classification runs on background queue (`modelQueue`)
- Uses `DispatchQueue` with `.userInitiated` QoS
- Avoids blocking UI thread
- Model inference typically <10ms on modern iPhones

### EmotionModelConfig

**Configurable Parameters**:
```swift
detectionThreshold: Double = 0.7           // Confidence threshold
minEmotionConfidence: Double = 0.5          // Minimum emotion confidence
triggerEmotions: Set<Emotion> = [.happy, .surprised]  // Which emotions trigger events
classificationWindowDuration: TimeInterval = 1.0      // Window size
windowOverlap: TimeInterval = 0.5                      // Overlap between windows
eventCooldownPeriod: TimeInterval = 3.0                // Cooldown after event
consecutiveDetectionsRequired: Int = 2                 // Smoothing threshold
classificationInterval: TimeInterval = 0.5             // How often to classify
```

## Usage

### Adding Model to Xcode

1. Drag `EmotionAudioClassifier.mlmodel` into your Xcode project
2. Ensure "Copy items if needed" is checked
3. Add to target membership
4. Xcode will auto-generate Swift class

### Model Loading

The service automatically loads the model on initialization:
```swift
private func loadCoreMLModel() {
    guard let modelURL = Bundle.main.url(forResource: "EmotionAudioClassifier", withExtension: "mlmodelc") ??
                         Bundle.main.url(forResource: "EmotionAudioClassifier", withExtension: "mlmodel") else {
        // Fallback to random detection if model not found
        return
    }
    // Load model...
}
```

### Adjusting Thresholds

Modify `EmotionModelConfig` values:
```swift
// More sensitive (detects more events)
EmotionModelConfig.detectionThreshold = 0.6
EmotionModelConfig.consecutiveDetectionsRequired = 1

// Less sensitive (fewer false positives)
EmotionModelConfig.detectionThreshold = 0.8
EmotionModelConfig.consecutiveDetectionsRequired = 3
```

## Fallback Behavior

If Core ML model is not found or fails to load:
- Service falls back to random emotion detection
- Allows testing without model
- Prints warning message to console

## Performance Optimization

### Battery Impact

- **Classification Frequency**: Lower `classificationInterval` = more CPU usage
- **Window Overlap**: Less overlap = fewer classifications = better battery
- **Background Queue**: Prevents UI blocking, but still uses CPU

### Recommendations

- Use default 0.5s classification interval for good balance
- Consider increasing to 1.0s for better battery life
- Monitor CPU usage in Instruments

## Testing

### Without Model
- Service works with fallback random detection
- Good for testing UI and flow

### With Model
1. Train model using Python script
2. Export to Core ML format
3. Add `.mlmodel` to Xcode project
4. Run app and test with real audio

### Test Scenarios
- Short laugh (should detect quickly)
- Long continuous laugh (should detect once, not multiple times)
- Background noise (should not trigger false positives)
- Quiet speech (should not trigger)

## Troubleshooting

**Model not loading**:
- Check model file is in bundle
- Verify file name matches exactly
- Check Xcode target membership

**Low accuracy**:
- Adjust `detectionThreshold` lower
- Check model was trained on similar audio
- Verify preprocessing matches training

**Too many false positives**:
- Increase `detectionThreshold`
- Increase `consecutiveDetectionsRequired`
- Increase `eventCooldownPeriod`

**Too few detections**:
- Decrease `detectionThreshold`
- Decrease `consecutiveDetectionsRequired`
- Check model confidence scores

**Performance issues**:
- Increase `classificationInterval`
- Reduce window overlap
- Profile with Instruments

## Future Enhancements

1. **Model Quantization**: Reduce model size and improve performance
2. **Adaptive Thresholds**: Adjust based on background noise level
3. **Multi-model Ensemble**: Combine multiple models for better accuracy
4. **Real-time Visualization**: Show emotion probabilities in UI
5. **Custom Training**: Allow users to fine-tune model on their voice

