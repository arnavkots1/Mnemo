"""
Data augmentation utilities for audio emotion classification.

Optional: More advanced augmentations using audiomentations library.
"""

import numpy as np


def get_train_augmentations():
    """
    Get data augmentation pipeline for training.
    
    Returns:
        Augmentation function or None
    """
    # For now, augmentations are handled in dataset.py
    # This can be extended with audiomentations library if needed
    return None


# Example using audiomentations (optional, uncomment if installed)
"""
from audiomentations import Compose, AddGaussianNoise, TimeStretch, PitchShift, Gain

def get_train_augmentations():
    return Compose([
        AddGaussianNoise(min_amplitude=0.001, max_amplitude=0.015, p=0.5),
        TimeStretch(min_rate=0.8, max_rate=1.25, p=0.5),
        PitchShift(min_semitones=-4, max_semitones=4, p=0.5),
        Gain(min_gain_in_db=-6, max_gain_in_db=6, p=0.5),
    ])
"""

