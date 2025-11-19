# Dataset Format

## Expected Structure

Place your audio files and labels CSV in this directory:

```
data/
├── audio/
│   ├── happy_sample_001.wav
│   ├── happy_sample_002.wav
│   ├── sad_sample_001.wav
│   └── ...
└── labels.csv
```

## CSV Format

The `labels.csv` file should have two columns:

```csv
path,label
audio/happy_sample_001.wav,happy
audio/happy_sample_002.wav,happy
audio/sad_sample_001.wav,sad
audio/angry_sample_001.wav,angry
audio/surprised_sample_001.wav,surprised
audio/neutral_sample_001.wav,neutral
```

### Column Descriptions

- **path**: Relative path to the audio file from the `data/` directory
- **label**: One of: `happy`, `sad`, `angry`, `surprised`, `neutral`

## Audio File Requirements

- **Format**: WAV files (recommended) or other formats supported by `librosa`
- **Sample Rate**: Any (will be resampled to 16 kHz during training)
- **Channels**: Mono or stereo (will be converted to mono)
- **Duration**: Variable (will be trimmed/padded to 1-2 seconds during preprocessing)

## Dataset Recommendations

- **Minimum samples per class**: 100+ (more is better)
- **Balanced classes**: Try to have similar number of samples per emotion
- **Diverse sources**: Include different speakers, environments, recording conditions
- **Quality**: Clear audio without excessive background noise

## Example Dataset Sources

- CREMA-D (public emotion dataset)
- RAVDESS (Ryerson Audio-Visual Database)
- Your own recordings (with proper consent)

## Preprocessing

The training script will automatically:
- Resample to 16 kHz
- Convert to mono
- Extract log-mel spectrograms
- Normalize audio levels

