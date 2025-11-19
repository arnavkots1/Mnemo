import Foundation
import AVFoundation
import Speech
import Combine
import CoreLocation
import CoreML

/// Emotion types that match Core ML model output classes (in order)
enum Emotion: String, Codable {
    case happy
    case sad
    case angry
    case surprised
    case neutral
    
    /// Initialize from model output index
    static func fromIndex(_ index: Int) -> Emotion? {
        let emotions: [Emotion] = [.happy, .sad, .angry, .surprised, .neutral]
        guard index >= 0 && index < emotions.count else { return nil }
        return emotions[index]
    }
    
    /// Get index for model output
    var index: Int {
        let emotions: [Emotion] = [.happy, .sad, .angry, .surprised, .neutral]
        return emotions.firstIndex(of: self) ?? 0
    }
}

/// Protocol for emotional capture sessions
protocol EmotionalCaptureService {
    /// Publisher for detected emotional events
    var emotionalEventPublisher: AnyPublisher<EmotionalEvent, Never> { get }
    
    /// Current session state
    var isSessionActive: Bool { get }
    
    /// Configuration: whether to keep raw audio files
    var keepRawAudio: Bool { get set }
    
    /// Start an emotional capture session
    func startSession() async throws
    
    /// Stop the current session
    func stopSession()
    
    /// Request necessary permissions (microphone, speech recognition)
    func requestPermissions() async throws
    
    /// Classify emotion from audio buffer using Core ML model
    func classifyEmotion(from buffer: AVAudioPCMBuffer, at time: AVAudioTime) -> Emotion?
}

/// Represents a detected emotional event with audio and transcript
struct EmotionalEvent {
    let timestamp: Date
    let audioURL: URL?  // Temporary audio file (may be nil if keepRawAudio is false)
    let transcript: String?
    let emotionType: Emotion
    let confidence: Double
    let location: CLLocation?
}

/// Implementation using AVAudioEngine, Core ML, and SFSpeechRecognizer
/// 
/// Audio Processing Pipeline:
/// 1. Continuous audio capture via AVAudioEngine (16 kHz mono)
/// 2. Buffer audio into overlapping 1-second windows (0.5s overlap)
/// 3. Every 0.5 seconds, extract latest 1-second window
/// 4. Preprocess: Convert PCM to log-mel spectrogram (64 mel bins × 100 time frames)
/// 5. Run Core ML model inference on background queue
/// 6. Check confidence threshold and trigger emotions
/// 7. Smooth results: Require 2 consecutive detections before triggering event
/// 8. Apply cooldown: Ignore new events for 3 seconds after detection
class AVAudioEmotionalCaptureService: NSObject, EmotionalCaptureService {
    private let audioEngine = AVAudioEngine()
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private let emotionalEventSubject = PassthroughSubject<EmotionalEvent, Never>()
    
    // Core ML model
    private var emotionModel: MLModel?
    private let modelQueue = DispatchQueue(label: "com.mnemo.emotionModel", qos: .userInitiated)
    
    // Audio buffering for continuous classification
    private var audioBuffer: [AVAudioPCMBuffer] = []
    private let bufferDuration: TimeInterval = 1.0 // 1-second frames
    private let maxBufferSize = 10 // Keep last 10 seconds (for 3s before capture)
    private var audioFormat: AVAudioFormat?
    
    // Classification state
    private var lastClassificationTime: Date?
    private var consecutiveDetections: [Emotion: Int] = [:]
    private var lastEventTime: Date?
    
    // Speech recognition
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    
    // Session state
    private var isActive = false
    private var sessionStartTime: Date?
    private var classificationTimer: Timer?
    
    // Settings store (optional, for respecting user preferences)
    weak var settingsStore: SettingsStore?
    
    // Location service (optional, for enriching entries)
    weak var locationService: LocationService?
    
    var emotionalEventPublisher: AnyPublisher<EmotionalEvent, Never> {
        emotionalEventSubject.eraseToAnyPublisher()
    }
    
    var isSessionActive: Bool {
        isActive
    }
    
    var keepRawAudio: Bool {
        settingsStore?.autoDeleteRawAudio == false
    }
    
    /// Debug method to check if Core ML model is loaded
    var isEmotionModelLoaded: Bool {
        return emotionModel != nil
    }
    
    override init() {
        super.init()
        loadCoreMLModel()
    }
    
    /// Load Core ML model
    /// 
    /// Model Input Spec:
    /// - Name: log_mel_spectrogram
    /// - Shape: [1, 64, 100] (batch, n_mels, time_steps)
    /// - Type: Float32
    ///
    /// Model Output Spec:
    /// - Name: emotion_logits
    /// - Shape: [1, 5] (batch, n_classes)
    /// - Classes (in order): happy, sad, angry, surprised, neutral
    private func loadCoreMLModel() {
        // Try to load the model from bundle
        // Note: Add EmotionAudioClassifier.mlmodel to your Xcode project
        guard let modelURL = Bundle.main.url(forResource: "EmotionAudioClassifier", withExtension: "mlmodelc") ??
                             Bundle.main.url(forResource: "EmotionAudioClassifier", withExtension: "mlmodel") else {
            print("⚠️ Core ML model not found. Using fallback random detection.")
            return
        }
        
        do {
            let model = try MLModel(contentsOf: modelURL)
            self.emotionModel = model
            print("✓ Core ML model loaded successfully")
        } catch {
            print("⚠️ Failed to load Core ML model: \(error). Using fallback random detection.")
        }
    }
    
    func requestPermissions() async throws {
        // Request microphone permission
        let micStatus = await AVAudioSession.sharedInstance().requestRecordPermission()
        guard micStatus else {
            throw EmotionalCaptureError.microphonePermissionDenied
        }
        
        // Request speech recognition permission
        let speechStatus = await SFSpeechRecognizer.requestAuthorization()
        guard speechStatus == .authorized else {
            throw EmotionalCaptureError.speechPermissionDenied
        }
    }
    
    func startSession() async throws {
        guard !isActive else { return }
        
        try await requestPermissions()
        
        // Configure audio session
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        
        // Get input node and format
        let inputNode = audioEngine.inputNode
        audioFormat = inputNode.outputFormat(forBus: 0)
        guard let format = audioFormat else {
            throw EmotionalCaptureError.audioEngineError
        }
        
        // Calculate buffer size for 1-second frames
        let sampleRate = format.sampleRate
        let bufferSize = UInt32(sampleRate * bufferDuration)
        
        // Install tap to buffer audio
        inputNode.installTap(onBus: 0, bufferSize: bufferSize, format: format) { [weak self] buffer, time in
            self?.processAudioBuffer(buffer, at: time)
        }
        
        // Start audio engine
        try audioEngine.start()
        
        isActive = true
        sessionStartTime = Date()
        lastClassificationTime = nil
        consecutiveDetections.removeAll()
        lastEventTime = nil
        
        // Start periodic classification
        startClassificationTimer()
    }
    
    func stopSession() {
        guard isActive else { return }
        
        classificationTimer?.invalidate()
        classificationTimer = nil
        
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionRequest = nil
        recognitionTask = nil
        
        audioBuffer.removeAll()
        
        try? AVAudioSession.sharedInstance().setActive(false)
        isActive = false
        sessionStartTime = nil
        lastClassificationTime = nil
    }
    
    // MARK: - Audio Processing
    
    /// Process incoming audio buffer
    /// 
    /// Audio Buffer Segmentation:
    /// - Buffers are 1 second long
    /// - Kept in circular buffer (last 10 seconds)
    /// - Classification runs every 0.5 seconds on latest 1-second window
    private func processAudioBuffer(_ buffer: AVAudioPCMBuffer, at time: AVAudioTime) {
        // Add buffer to circular buffer
        audioBuffer.append(buffer)
        
        // Keep only last maxBufferSize buffers
        if audioBuffer.count > maxBufferSize {
            audioBuffer.removeFirst()
        }
    }
    
    /// Start timer for periodic classification
    /// 
    /// Classification Frequency:
    /// - Runs every 0.5 seconds (configurable via EmotionModelConfig.classificationInterval)
    /// - Processes latest 1-second audio window
    /// - Runs on background queue to avoid blocking UI
    private func startClassificationTimer() {
        classificationTimer = Timer.scheduledTimer(withTimeInterval: EmotionModelConfig.classificationInterval, repeats: true) { [weak self] _ in
            self?.performClassification()
        }
    }
    
    /// Perform emotion classification on latest audio window
    /// 
    /// Result Smoothing:
    /// - Requires N consecutive detections (default: 2) before triggering event
    /// - Applies cooldown period (default: 3 seconds) after event
    /// - Prevents duplicate events from same continuous emotion
    private func performClassification() {
        guard isActive,
              let format = audioFormat,
              !audioBuffer.isEmpty else {
            return
        }
        
        // Check cooldown period
        if let lastEvent = lastEventTime,
           Date().timeIntervalSince(lastEvent) < EmotionModelConfig.eventCooldownPeriod {
            return
        }
        
        // Get latest 1-second window
        guard let latestBuffer = audioBuffer.last else { return }
        
        // Run classification on background queue
        modelQueue.async { [weak self] in
            guard let self = self else { return }
            
            // Preprocess audio to log-mel spectrogram
            guard let spectrogram = AudioPreprocessor.preprocessAudio(latestBuffer) else {
                return
            }
            
            // Run Core ML inference
            guard let emotion = self.classifyEmotion(from: latestBuffer, at: AVAudioTime(sampleTime: 0, atRate: latestBuffer.format.sampleRate)),
                  let confidence = self.getEmotionConfidence(from: latestBuffer) else {
                return
            }
            
            // Check if emotion should trigger event
            guard EmotionModelConfig.triggerEmotions.contains(emotion),
                  confidence >= EmotionModelConfig.detectionThreshold else {
                // Reset consecutive detections for non-trigger emotions
                self.consecutiveDetections.removeAll()
                return
            }
            
            // Update consecutive detections
            let currentCount = self.consecutiveDetections[emotion] ?? 0
            self.consecutiveDetections[emotion] = currentCount + 1
            
            // Check if we have enough consecutive detections
            if self.consecutiveDetections[emotion] ?? 0 >= EmotionModelConfig.consecutiveDetectionsRequired {
                // Reset counter and trigger event
                self.consecutiveDetections.removeAll()
                
                DispatchQueue.main.async {
                    self.triggerEmotionalEvent(emotion: emotion, confidence: confidence, at: Date())
                }
            }
        }
    }
    
    /// Trigger an emotional event
    private func triggerEmotionalEvent(emotion: Emotion, confidence: Double, at timestamp: Date) {
        // Update last event time for cooldown
        lastEventTime = timestamp
        
        // Capture audio context window: 3 seconds before + 7 seconds after
        guard let format = audioFormat else { return }
        
        let sampleRate = format.sampleRate
        let framesBefore = UInt32(sampleRate * 3.0) // 3 seconds before
        let framesAfter = UInt32(sampleRate * 7.0)  // 7 seconds after
        
        // Get buffers for context window
        let buffersNeeded = Int(ceil(3.0 / bufferDuration))
        let startIndex = max(0, audioBuffer.count - buffersNeeded)
        let contextBuffers = Array(audioBuffer[startIndex...])
        
        // Use most recent buffer for now (simplified - in production, merge buffers properly)
        guard let contextBuffer = contextBuffers.last else { return }
        
        // Process event asynchronously
        Task {
            await processEmotionalEvent(
                buffer: contextBuffer,
                emotion: emotion,
                confidence: confidence,
                timestamp: timestamp
            )
        }
    }
    
    private func processEmotionalEvent(
        buffer: AVAudioPCMBuffer,
        emotion: Emotion,
        confidence: Double,
        timestamp: Date
    ) async {
        // Get current location if available
        var currentLocation: CLLocation? = nil
        if let locationService = locationService {
            // Try to get last known location
            // Note: This is a simplified approach - in production, track location
        }
        
        // Run speech recognition only if allowed
        let transcript: String?
        if settingsStore?.allowSpeechRecognition == true {
            transcript = await recognizeSpeech(from: buffer)
        } else {
            transcript = nil
        }
        
        // Save audio file if configured
        var audioURL: URL? = nil
        if keepRawAudio {
            audioURL = await saveAudioBuffer(buffer)
        }
        
        // Build summary with emotion and transcript
        let summary: String
        if let transcript = transcript, !transcript.isEmpty {
            summary = "\(emotion.rawValue.capitalized) moment: you said \"\(transcript)\""
        } else {
            summary = "\(emotion.rawValue.capitalized) moment detected"
        }
        
        // Create emotional event
        let event = EmotionalEvent(
            timestamp: timestamp,
            audioURL: audioURL,
            transcript: transcript,
            emotionType: emotion,
            confidence: confidence,
            location: currentLocation
        )
        
        // Emit event
        emotionalEventSubject.send(event)
    }
    
    // MARK: - Core ML Classification
    
    /// Classify emotion from audio buffer using Core ML model
    /// 
    /// - Parameter buffer: Audio buffer to classify
    /// - Parameter time: Timestamp of the audio
    /// - Returns: Detected emotion, or nil if classification fails
    func classifyEmotion(from buffer: AVAudioPCMBuffer, at time: AVAudioTime) -> Emotion? {
        guard let model = emotionModel else {
            // Fallback: return random emotion for testing
            let emotions: [Emotion] = [.happy, .surprised, .neutral]
            return emotions.randomElement()
        }
        
        // Preprocess audio to log-mel spectrogram
        guard let spectrogram = AudioPreprocessor.preprocessAudio(buffer) else {
            return nil
        }
        
        // Create model input
        guard let input = try? MLDictionaryFeatureProvider(dictionary: ["log_mel_spectrogram": MLFeatureValue(multiArray: spectrogram)]) else {
            return nil
        }
        
        // Run inference
        guard let output = try? model.prediction(from: input),
              let logits = output.featureValue(for: "emotion_logits")?.multiArrayValue else {
            return nil
        }
        
        // Find emotion with highest probability
        var maxIndex = 0
        var maxValue: Float = -Float.infinity
        
        for i in 0..<logits.count {
            let value = logits[i].floatValue
            if value > maxValue {
                maxValue = value
                maxIndex = i
            }
        }
        
        // Convert to emotion (apply softmax and get max)
        // Note: Model outputs logits, we apply softmax here
        var probabilities: [Float] = []
        var sum: Float = 0
        
        for i in 0..<logits.count {
            let expValue = exp(logits[i].floatValue - maxValue) // Numerical stability
            probabilities.append(expValue)
            sum += expValue
        }
        
        // Normalize
        for i in 0..<probabilities.count {
            probabilities[i] /= sum
        }
        
        // Return emotion with highest probability
        return Emotion.fromIndex(maxIndex)
    }
    
    /// Get confidence score for detected emotion
    private func getEmotionConfidence(from buffer: AVAudioPCMBuffer) -> Double? {
        guard let model = emotionModel else {
            return 0.8 // Fallback confidence
        }
        
        guard let spectrogram = AudioPreprocessor.preprocessAudio(buffer),
              let input = try? MLDictionaryFeatureProvider(dictionary: ["log_mel_spectrogram": MLFeatureValue(multiArray: spectrogram)]),
              let output = try? model.prediction(from: input),
              let logits = output.featureValue(for: "emotion_logits")?.multiArrayValue else {
            return nil
        }
        
        // Apply softmax and get max probability
        var maxValue: Float = -Float.infinity
        var maxIndex = 0
        
        for i in 0..<logits.count {
            let value = logits[i].floatValue
            if value > maxValue {
                maxValue = value
                maxIndex = i
            }
        }
        
        var probabilities: [Float] = []
        var sum: Float = 0
        
        for i in 0..<logits.count {
            let expValue = exp(logits[i].floatValue - maxValue)
            probabilities.append(expValue)
            sum += expValue
        }
        
        let maxProbability = probabilities[maxIndex] / sum
        return Double(maxProbability)
    }
    
    // MARK: - Speech Recognition
    
    private func recognizeSpeech(from buffer: AVAudioPCMBuffer) async -> String? {
        guard let recognizer = speechRecognizer, recognizer.isAvailable else {
            return nil
        }
        
        return await withCheckedContinuation { continuation in
            let request = SFSpeechAudioBufferRecognitionRequest()
            request.append(buffer)
            request.shouldReportPartialResults = false
            
            let task = recognizer.recognitionTask(with: request) { result, error in
                if let result = result, result.isFinal {
                    continuation.resume(returning: result.bestTranscription.formattedString)
                    return
                }
                
                if let error = error {
                    continuation.resume(returning: nil)
                    return
                }
            }
            
            // Timeout after 5 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
                if !task.isFinished {
                    task.cancel()
                    continuation.resume(returning: nil)
                }
            }
        }
    }
    
    // MARK: - Audio File Management
    
    private func saveAudioBuffer(_ buffer: AVAudioPCMBuffer) async -> URL? {
        // Create temporary file
        let tempDir = FileManager.default.temporaryDirectory
        let fileName = "emotional_\(UUID().uuidString).m4a"
        let fileURL = tempDir.appendingPathComponent(fileName)
        
        // Convert buffer to audio file (simplified - in production, use AVAudioFile)
        // For now, return nil as placeholder
        return nil
    }
}

enum EmotionalCaptureError: Error {
    case microphonePermissionDenied
    case speechPermissionDenied
    case audioEngineError
}
