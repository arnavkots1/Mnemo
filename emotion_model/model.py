"""
Lightweight audio emotion classification model for on-device inference.

Architecture: 1D CNN on log-mel spectrograms
Designed to be small and fast for mobile deployment via Core ML.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class EmotionClassifier(nn.Module):
    """
    Lightweight CNN-based emotion classifier for audio.
    
    Input: Log-mel spectrogram (time_steps, n_mels)
    Output: Emotion probabilities (5 classes: happy, sad, angry, surprised, neutral)
    
    Architecture:
    - 1D convolutions over time dimension
    - Global average pooling
    - Fully connected layers
    """
    
    def __init__(
        self,
        n_mels: int = 64,
        n_classes: int = 5,
        dropout: float = 0.3
    ):
        """
        Args:
            n_mels: Number of mel filter banks (spectrogram height)
            n_classes: Number of emotion classes (default: 5)
            dropout: Dropout probability
        """
        super(EmotionClassifier, self).__init__()
        
        self.n_mels = n_mels
        self.n_classes = n_classes
        
        # 1D CNN layers (operating on time dimension)
        # Input shape: (batch, n_mels, time_steps)
        self.conv1 = nn.Conv1d(
            in_channels=n_mels,
            out_channels=32,
            kernel_size=3,
            padding=1
        )
        self.bn1 = nn.BatchNorm1d(32)
        
        self.conv2 = nn.Conv1d(
            in_channels=32,
            out_channels=64,
            kernel_size=3,
            padding=1
        )
        self.bn2 = nn.BatchNorm1d(64)
        
        self.conv3 = nn.Conv1d(
            in_channels=64,
            out_channels=128,
            kernel_size=3,
            padding=1
        )
        self.bn3 = nn.BatchNorm1d(128)
        
        # Global average pooling (reduces time dimension to 1)
        self.global_pool = nn.AdaptiveAvgPool1d(1)
        
        # Fully connected layers
        self.fc1 = nn.Linear(128, 64)
        self.dropout = nn.Dropout(dropout)
        self.fc2 = nn.Linear(64, n_classes)
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        
        Args:
            x: Input tensor of shape (batch, n_mels, time_steps)
            
        Returns:
            Logits tensor of shape (batch, n_classes)
        """
        # x shape: (batch, n_mels, time_steps)
        
        # Conv block 1
        x = self.conv1(x)
        x = self.bn1(x)
        x = F.relu(x)
        x = F.max_pool1d(x, kernel_size=2)
        
        # Conv block 2
        x = self.conv2(x)
        x = self.bn2(x)
        x = F.relu(x)
        x = F.max_pool1d(x, kernel_size=2)
        
        # Conv block 3
        x = self.conv3(x)
        x = self.bn3(x)
        x = F.relu(x)
        x = F.max_pool1d(x, kernel_size=2)
        
        # Global average pooling: (batch, 128, time) -> (batch, 128, 1)
        x = self.global_pool(x)
        x = x.squeeze(-1)  # (batch, 128)
        
        # Fully connected layers
        x = self.fc1(x)
        x = F.relu(x)
        x = self.dropout(x)
        x = self.fc2(x)
        
        return x
    
    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """
        Get probability distribution over classes.
        
        Args:
            x: Input tensor
            
        Returns:
            Probability tensor of shape (batch, n_classes)
        """
        logits = self.forward(x)
        return F.softmax(logits, dim=1)


def count_parameters(model: nn.Module) -> int:
    """Count the number of trainable parameters in the model."""
    return sum(p.numel() for p in model.parameters() if p.requires_grad)


if __name__ == "__main__":
    # Test model with dummy input
    model = EmotionClassifier(n_mels=64, n_classes=5)
    
    # Dummy input: (batch=1, n_mels=64, time_steps=100)
    dummy_input = torch.randn(1, 64, 100)
    
    # Forward pass
    output = model(dummy_input)
    proba = model.predict_proba(dummy_input)
    
    print(f"Model parameters: {count_parameters(model):,}")
    print(f"Input shape: {dummy_input.shape}")
    print(f"Output logits shape: {output.shape}")
    print(f"Output probabilities shape: {proba.shape}")
    print(f"Probabilities: {proba[0]}")

