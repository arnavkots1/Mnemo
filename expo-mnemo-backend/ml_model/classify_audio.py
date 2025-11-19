"""
Standalone script to classify audio using trained model

Usage: python classify_audio.py <audio_path>
Output: JSON with emotion and confidence
"""

import sys
import json
from emotion_classifier import get_classifier

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            'error': 'Audio path required',
            'emotion': 'neutral',
            'confidence': 0.5
        }))
        sys.exit(1)
    
    audio_path = sys.argv[1]
    
    try:
        classifier = get_classifier()
        emotion, confidence = classifier.classify(audio_path)
        
        result = {
            'emotion': emotion,
            'confidence': float(confidence)
        }
        
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            'error': str(e),
            'emotion': 'neutral',
            'confidence': 0.5
        }))
        sys.exit(1)

if __name__ == '__main__':
    main()

