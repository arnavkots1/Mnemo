import Foundation
import AVFoundation
import Accelerate
import CoreML

/// Preprocesses audio for Core ML emotion classification
/// Converts PCM audio buffers to log-mel spectrograms
class AudioPreprocessor {
    // Model input specifications (must match training)
    static let targetSampleRate: Double = 16000.0
    static let nMelBins: Int = 64
    static let nTimeFrames: Int = 100
    static let fftSize: Int = 2048
    static let hopLength: Int = 512
    
    /// Convert PCM audio buffer to log-mel spectrogram
    /// 
    /// Audio Buffer Segmentation:
    /// - Input: Variable-length PCM buffer (typically 1 second)
    /// - Process: Extract log-mel spectrogram with fixed dimensions
    /// - Output: MLMultiArray of shape [1, nMelBins, nTimeFrames]
    ///
    /// Steps:
    /// 1. Resample to 16 kHz if needed
    /// 2. Convert to mono
    /// 3. Extract mel spectrogram using FFT
    /// 4. Convert to log scale
    /// 5. Normalize and pad/trim to fixed time frames
    ///
    /// - Parameter buffer: AVAudioPCMBuffer containing audio data
    /// - Returns: MLMultiArray ready for Core ML model input, or nil if conversion fails
    static func preprocessAudio(_ buffer: AVAudioPCMBuffer) -> MLMultiArray? {
        guard let format = buffer.format.streamDescription else {
            return nil
        }
        
        let sampleRate = format.pointee.mSampleRate
        let channelCount = Int(format.pointee.mChannelsPerFrame)
        
        // Convert buffer to float array
        guard let channelData = buffer.floatChannelData else {
            return nil
        }
        
        // Extract mono channel (use first channel if stereo)
        let frameCount = Int(buffer.frameLength)
        var audioSamples = [Float](repeating: 0, count: frameCount)
        
        if channelCount == 1 {
            // Mono: copy directly
            let channelPointer = channelData.pointee
            for i in 0..<frameCount {
                audioSamples[i] = channelPointer[i]
            }
        } else {
            // Stereo: average channels
            let channelPointer = channelData.pointee
            for i in 0..<frameCount {
                var sum: Float = 0
                for channel in 0..<channelCount {
                    let stride = Int(buffer.stride)
                    sum += channelPointer[i * stride + channel]
                }
                audioSamples[i] = sum / Float(channelCount)
            }
        }
        
        // Resample to target sample rate if needed
        if abs(sampleRate - targetSampleRate) > 100 {
            audioSamples = resample(audioSamples, from: sampleRate, to: targetSampleRate)
        }
        
        // Extract log-mel spectrogram
        guard let melSpectrogram = extractLogMelSpectrogram(from: audioSamples) else {
            return nil
        }
        
        // Convert to MLMultiArray
        return convertToMLMultiArray(melSpectrogram)
    }
    
    /// Extract log-mel spectrogram from audio samples
    private static func extractLogMelSpectrogram(from samples: [Float]) -> [[Float]]? {
        // Calculate number of time frames
        let nSamples = samples.count
        let nFrames = (nSamples - fftSize) / hopLength + 1
        
        guard nFrames > 0 else { return nil }
        
        // Create mel filter bank
        guard let melFilters = createMelFilterBank() else { return nil }
        
        // Compute STFT and mel spectrogram
        var melSpec = [[Float]](repeating: [Float](repeating: 0, count: nFrames), count: nMelBins)
        
        // Process each frame
        for frameIdx in 0..<nFrames {
            let startIdx = frameIdx * hopLength
            
            // Extract frame and apply window
            var frame = [Float](repeating: 0, count: fftSize)
            for i in 0..<min(fftSize, nSamples - startIdx) {
                // Hamming window
                let window = 0.54 - 0.46 * cos(2.0 * Float.pi * Float(i) / Float(fftSize - 1))
                frame[i] = samples[startIdx + i] * window
            }
            
            // Compute FFT magnitude spectrum
            guard let magnitudeSpectrum = computeFFT(frame) else { continue }
            
            // Apply mel filter bank
            for melIdx in 0..<nMelBins {
                var melEnergy: Float = 0
                for freqIdx in 0..<magnitudeSpectrum.count {
                    melEnergy += magnitudeSpectrum[freqIdx] * melFilters[melIdx][freqIdx]
                }
                melSpec[melIdx][frameIdx] = melEnergy
            }
        }
        
        // Convert to log scale
        for melIdx in 0..<nMelBins {
            for frameIdx in 0..<nFrames {
                let value = melSpec[melIdx][frameIdx]
                melSpec[melIdx][frameIdx] = log10(max(value, 1e-10))
            }
        }
        
        // Normalize (subtract max for stability)
        var maxVal: Float = -Float.infinity
        for row in melSpec {
            maxVal = max(maxVal, row.max() ?? -Float.infinity)
        }
        if maxVal.isFinite {
            for melIdx in 0..<nMelBins {
                for frameIdx in 0..<nFrames {
                    melSpec[melIdx][frameIdx] -= maxVal
                }
            }
        }
        
        // Pad or trim to fixed time frames
        return padOrTrimTimeFrames(melSpec, targetFrames: nTimeFrames)
    }
    
    /// Create mel filter bank
    private static func createMelFilterBank() -> [[Float]]? {
        let nyquist = Float(targetSampleRate / 2.0)
        let minMel = hzToMel(0)
        let maxMel = hzToMel(nyquist)
        
        var filters = [[Float]](repeating: [Float](repeating: 0, count: fftSize / 2 + 1), count: nMelBins)
        
        let melSpacing = (maxMel - minMel) / Float(nMelBins + 1)
        let freqBinWidth = Float(targetSampleRate) / Float(fftSize)
        
        for i in 0..<nMelBins {
            let centerMel = minMel + Float(i + 1) * melSpacing
            let centerHz = melToHz(centerMel)
            let centerBin = Int(centerHz / freqBinWidth)
            
            let startMel = minMel + Float(i) * melSpacing
            let endMel = minMel + Float(i + 2) * melSpacing
            let startHz = melToHz(startMel)
            let endHz = melToHz(endMel)
            let startBin = Int(startHz / freqBinWidth)
            let endBin = Int(endHz / freqBinWidth)
            
            for bin in startBin..<min(endBin, fftSize / 2 + 1) {
                if bin < centerBin {
                    filters[i][bin] = Float(bin - startBin) / Float(centerBin - startBin)
                } else if bin < endBin {
                    filters[i][bin] = Float(endBin - bin) / Float(endBin - centerBin)
                }
            }
        }
        
        return filters
    }
    
    /// Compute FFT magnitude spectrum
    private static func computeFFT(_ samples: [Float]) -> [Float]? {
        let n = samples.count
        guard n > 0, n.isPowerOfTwo else {
            // Pad to next power of 2
            let nextPowerOf2 = Int(pow(2, ceil(log2(Double(n)))))
            var paddedSamples = samples
            paddedSamples.append(contentsOf: [Float](repeating: 0, count: nextPowerOf2 - n))
            return computeFFT(paddedSamples)
        }
        
        let log2n = vDSP_Length(log2(Double(n)))
        guard let fftSetup = vDSP_create_fftsetup(log2n, FFTRadix(kFFTRadix2)) else {
            return nil
        }
        
        defer { vDSP_destroy_fftsetup(fftSetup) }
        
        var realp = [Float](repeating: 0, count: n / 2)
        var imagp = [Float](repeating: 0, count: n / 2)
        var splitComplex = DSPSplitComplex(realp: &realp, imagp: &imagp)
        
        // Convert real samples to complex format
        var samplesCopy = samples
        samplesCopy.withUnsafeMutableBufferPointer { mutablePtr in
            vDSP_ctoz(UnsafePointer<DSPComplex>(mutablePtr.baseAddress!), 2, &splitComplex, 1, vDSP_Length(n / 2))
        }
        
        // Perform FFT
        vDSP_fft_zrip(fftSetup, &splitComplex, 1, log2n, FFTDirection(FFT_FORWARD))
        
        // Compute magnitude spectrum
        var magnitude = [Float](repeating: 0, count: n / 2 + 1)
        vDSP_zvmags(&splitComplex, 1, &magnitude, 1, vDSP_Length(n / 2 + 1))
        
        // Convert to magnitude (not power)
        for i in 0..<magnitude.count {
            magnitude[i] = sqrt(magnitude[i])
        }
        
        return magnitude
    }
    
    /// Convert mel spectrogram to MLMultiArray
    private static func convertToMLMultiArray(_ melSpec: [[Float]]) -> MLMultiArray? {
        let shape = [1, nMelBins, nTimeFrames] as [NSNumber]
        
        guard let array = try? MLMultiArray(shape: shape, dataType: .float32) else {
            return nil
        }
        
        var index = 0
        for melIdx in 0..<nMelBins {
            for timeIdx in 0..<nTimeFrames {
                array[index] = NSNumber(value: melSpec[melIdx][timeIdx])
                index += 1
            }
        }
        
        return array
    }
    
    /// Pad or trim time frames to target length
    private static func padOrTrimTimeFrames(_ melSpec: [[Float]], targetFrames: Int) -> [[Float]] {
        let currentFrames = melSpec.first?.count ?? 0
        
        if currentFrames == targetFrames {
            return melSpec
        } else if currentFrames < targetFrames {
            // Pad with zeros
            return melSpec.map { row in
                var padded = row
                padded.append(contentsOf: [Float](repeating: 0, count: targetFrames - currentFrames))
                return padded
            }
        } else {
            // Trim (take center frames)
            let startIdx = (currentFrames - targetFrames) / 2
            return melSpec.map { row in
                Array(row[startIdx..<startIdx + targetFrames])
            }
        }
    }
    
    /// Resample audio using linear interpolation
    private static func resample(_ samples: [Float], from sourceRate: Double, to targetRate: Double) -> [Float] {
        let ratio = targetRate / sourceRate
        let targetCount = Int(Double(samples.count) * ratio)
        var resampled = [Float](repeating: 0, count: targetCount)
        
        for i in 0..<targetCount {
            let sourceIndex = Double(i) / ratio
            let lower = Int(floor(sourceIndex))
            let upper = min(lower + 1, samples.count - 1)
            let fraction = sourceIndex - Double(lower)
            
            if lower < samples.count {
                resampled[i] = samples[lower] * Float(1 - fraction) + samples[upper] * Float(fraction)
            }
        }
        
        return resampled
    }
    
    /// Convert Hz to Mel scale
    private static func hzToMel(_ hz: Float) -> Float {
        return 2595 * log10(1 + hz / 700)
    }
    
    /// Convert Mel to Hz scale
    private static func melToHz(_ mel: Float) -> Float {
        return 700 * (pow(10, mel / 2595) - 1)
    }
}

// MARK: - Helper Extensions

extension Int {
    var isPowerOfTwo: Bool {
        return self > 0 && (self & (self - 1)) == 0
    }
}

