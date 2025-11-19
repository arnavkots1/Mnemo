"""
Training script for audio emotion classification model.

Usage:
    python train.py --data_dir data --epochs 50 --batch_size 32
"""

import argparse
import os
import json
from pathlib import Path
from typing import Tuple, Dict

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
import matplotlib.pyplot as plt
import seaborn as sns
from tqdm import tqdm
import coremltools as ct
import onnx
import onnxruntime

from model import EmotionClassifier
from dataset import AudioEmotionDataset
from augmentations import get_train_augmentations


# Emotion class mapping (must match iOS Emotion enum order)
EMOTION_CLASSES = ['happy', 'sad', 'angry', 'surprised', 'neutral']
EMOTION_TO_IDX = {emotion: idx for idx, emotion in enumerate(EMOTION_CLASSES)}
IDX_TO_EMOTION = {idx: emotion for emotion, idx in EMOTION_TO_IDX.items()}


def train_epoch(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: nn.Module,
    optimizer: optim.Optimizer,
    device: torch.device
) -> Tuple[float, float]:
    """Train for one epoch."""
    model.train()
    running_loss = 0.0
    all_preds = []
    all_labels = []
    
    for spectrograms, labels in tqdm(dataloader, desc="Training"):
        spectrograms = spectrograms.to(device)
        labels = labels.to(device)
        
        # Forward pass
        optimizer.zero_grad()
        outputs = model(spectrograms)
        loss = criterion(outputs, labels)
        
        # Backward pass
        loss.backward()
        optimizer.step()
        
        # Metrics
        running_loss += loss.item()
        _, preds = torch.max(outputs, 1)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())
    
    epoch_loss = running_loss / len(dataloader)
    epoch_acc = accuracy_score(all_labels, all_preds)
    
    return epoch_loss, epoch_acc


def validate(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: nn.Module,
    device: torch.device
) -> Tuple[float, float, np.ndarray]:
    """Validate the model."""
    model.eval()
    running_loss = 0.0
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for spectrograms, labels in tqdm(dataloader, desc="Validating"):
            spectrograms = spectrograms.to(device)
            labels = labels.to(device)
            
            outputs = model(spectrograms)
            loss = criterion(outputs, labels)
            
            running_loss += loss.item()
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    
    epoch_loss = running_loss / len(dataloader)
    epoch_acc = accuracy_score(all_labels, all_preds)
    cm = confusion_matrix(all_labels, all_preds)
    
    return epoch_loss, epoch_acc, cm


def plot_confusion_matrix(cm: np.ndarray, save_path: str):
    """Plot and save confusion matrix."""
    plt.figure(figsize=(10, 8))
    sns.heatmap(
        cm,
        annot=True,
        fmt='d',
        cmap='Blues',
        xticklabels=EMOTION_CLASSES,
        yticklabels=EMOTION_CLASSES
    )
    plt.title('Confusion Matrix')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()


def export_to_onnx(model: nn.Module, save_path: str, n_mels: int = 64, time_steps: int = 100):
    """Export PyTorch model to ONNX format."""
    model.eval()
    
    # Dummy input for tracing
    dummy_input = torch.randn(1, n_mels, time_steps)
    
    torch.onnx.export(
        model,
        dummy_input,
        save_path,
        input_names=['log_mel_spectrogram'],
        output_names=['emotion_logits'],
        dynamic_axes={
            'log_mel_spectrogram': {0: 'batch_size'},
            'emotion_logits': {0: 'batch_size'}
        },
        opset_version=13
    )
    
    print(f"✓ Exported ONNX model to {save_path}")
    
    # Verify ONNX model
    onnx_model = onnx.load(save_path)
    onnx.checker.check_model(onnx_model)
    print("✓ ONNX model verification passed")


def export_to_coreml(
    onnx_path: str,
    save_path: str,
    n_mels: int = 64,
    time_steps: int = 100
):
    """
    Convert ONNX model to Core ML format.
    
    Core ML Model Spec:
    - Input: log_mel_spectrogram (Float32, shape: [1, n_mels, time_steps])
    - Output: emotion_logits (Float32, shape: [1, 5])
    - Output classes (in order): happy, sad, angry, surprised, neutral
    """
    # Load ONNX model
    onnx_model = onnx.load(onnx_path)
    
    # Convert to Core ML
    mlmodel = ct.convert(
        onnx_model,
        inputs=[
            ct.TensorType(
                name="log_mel_spectrogram",
                shape=(1, n_mels, time_steps)
            )
        ],
        outputs=[
            ct.TensorType(name="emotion_logits")
        ]
    )
    
    # Add metadata
    mlmodel.author = "Mnemo"
    mlmodel.short_description = "Audio emotion classifier for on-device inference"
    mlmodel.version = "1.0"
    
    # Add input/output descriptions
    mlmodel.input_description["log_mel_spectrogram"] = (
        f"Log-mel spectrogram of shape ({n_mels}, {time_steps}). "
        f"n_mels={n_mels} mel filter banks, time_steps={time_steps} time frames. "
        f"Expected sample rate: 16 kHz, duration: ~{time_steps * 0.01:.1f} seconds"
    )
    
    mlmodel.output_description["emotion_logits"] = (
        "Logits for 5 emotion classes in order: happy, sad, angry, surprised, neutral. "
        "Apply softmax to get probabilities."
    )
    
    # Save
    mlmodel.save(save_path)
    print(f"✓ Exported Core ML model to {save_path}")
    print(f"✓ Model input: log_mel_spectrogram shape ({1}, {n_mels}, {time_steps})")
    print(f"✓ Model output: emotion_logits shape ({1}, 5)")
    print(f"✓ Emotion classes (in order): {', '.join(EMOTION_CLASSES)}")


def main():
    parser = argparse.ArgumentParser(description='Train audio emotion classifier')
    parser.add_argument('--data_dir', type=str, default='data', help='Path to data directory')
    parser.add_argument('--csv_path', type=str, default='data/labels.csv', help='Path to labels CSV')
    parser.add_argument('--epochs', type=int, default=50, help='Number of training epochs')
    parser.add_argument('--batch_size', type=int, default=32, help='Batch size')
    parser.add_argument('--lr', type=float, default=0.001, help='Learning rate')
    parser.add_argument('--val_split', type=float, default=0.2, help='Validation split ratio')
    parser.add_argument('--n_mels', type=int, default=64, help='Number of mel filter banks')
    parser.add_argument('--time_steps', type=int, default=100, help='Number of time frames')
    parser.add_argument('--sample_rate', type=int, default=16000, help='Audio sample rate')
    parser.add_argument('--use_augmentation', action='store_true', help='Use data augmentation')
    parser.add_argument('--early_stopping_patience', type=int, default=5, help='Early stopping patience')
    parser.add_argument('--output_dir', type=str, default='outputs', help='Output directory')
    
    args = parser.parse_args()
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    # Load dataset
    print("Loading dataset...")
    full_dataset = AudioEmotionDataset(
        csv_path=args.csv_path,
        data_dir=args.data_dir,
        n_mels=args.n_mels,
        time_steps=args.time_steps,
        sample_rate=args.sample_rate,
        use_augmentation=args.use_augmentation
    )
    
    # Train/val split
    val_size = int(len(full_dataset) * args.val_split)
    train_size = len(full_dataset) - val_size
    train_dataset, val_dataset = random_split(
        full_dataset,
        [train_size, val_size],
        generator=torch.Generator().manual_seed(42)
    )
    
    # Disable augmentation for validation
    val_dataset.dataset.use_augmentation = False
    
    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False)
    
    print(f"Train samples: {len(train_dataset)}, Val samples: {len(val_dataset)}")
    
    # Model
    model = EmotionClassifier(n_mels=args.n_mels, n_classes=len(EMOTION_CLASSES))
    model = model.to(device)
    print(f"Model parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=args.lr)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', patience=3, factor=0.5)
    
    # Training loop
    best_val_acc = 0.0
    patience_counter = 0
    train_history = {'loss': [], 'acc': [], 'val_loss': [], 'val_acc': []}
    
    print("\nStarting training...")
    for epoch in range(args.epochs):
        print(f"\nEpoch {epoch+1}/{args.epochs}")
        
        # Train
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        
        # Validate
        val_loss, val_acc, cm = validate(model, val_loader, criterion, device)
        
        # Learning rate scheduling
        scheduler.step(val_loss)
        
        # History
        train_history['loss'].append(train_loss)
        train_history['acc'].append(train_acc)
        train_history['val_loss'].append(val_loss)
        train_history['val_acc'].append(val_acc)
        
        print(f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.4f}")
        print(f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}")
        
        # Early stopping
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            patience_counter = 0
            
            # Save best model
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_acc': val_acc,
                'n_mels': args.n_mels,
                'time_steps': args.time_steps,
            }, os.path.join(args.output_dir, 'best_model.pth'))
            
            # Save confusion matrix
            plot_confusion_matrix(cm, os.path.join(args.output_dir, 'confusion_matrix.png'))
            
            print(f"✓ New best model saved (val_acc: {val_acc:.4f})")
        else:
            patience_counter += 1
            if patience_counter >= args.early_stopping_patience:
                print(f"Early stopping triggered after {epoch+1} epochs")
                break
    
    # Load best model for export
    print("\nLoading best model for export...")
    checkpoint = torch.load(os.path.join(args.output_dir, 'best_model.pth'))
    model.load_state_dict(checkpoint['model_state_dict'])
    
    # Final evaluation
    print("\nFinal evaluation on validation set...")
    val_loss, val_acc, cm = validate(model, val_loader, criterion, device)
    print(f"Final Val Accuracy: {val_acc:.4f}")
    
    # Classification report
    model.eval()
    all_preds = []
    all_labels = []
    with torch.no_grad():
        for spectrograms, labels in val_loader:
            spectrograms = spectrograms.to(device)
            outputs = model(spectrograms)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    
    print("\nClassification Report:")
    print(classification_report(all_labels, all_preds, target_names=EMOTION_CLASSES))
    
    # Export models
    print("\nExporting models...")
    
    # Export to ONNX
    onnx_path = os.path.join(args.output_dir, 'emotion_classifier.onnx')
    export_to_onnx(model, onnx_path, n_mels=args.n_mels, time_steps=args.time_steps)
    
    # Export to Core ML
    coreml_path = os.path.join(args.output_dir, 'EmotionClassifier.mlmodel')
    export_to_coreml(onnx_path, coreml_path, n_mels=args.n_mels, time_steps=args.time_steps)
    
    # Save training history and config
    with open(os.path.join(args.output_dir, 'training_history.json'), 'w') as f:
        json.dump(train_history, f, indent=2)
    
    config = {
        'n_mels': args.n_mels,
        'time_steps': args.time_steps,
        'sample_rate': args.sample_rate,
        'emotion_classes': EMOTION_CLASSES,
        'best_val_acc': float(best_val_acc),
        'final_val_acc': float(val_acc)
    }
    with open(os.path.join(args.output_dir, 'model_config.json'), 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"\n✓ Training complete! Models saved to {args.output_dir}/")
    print(f"✓ Core ML model: {coreml_path}")
    print(f"✓ Copy EmotionClassifier.mlmodel to your iOS project")


if __name__ == '__main__':
    main()

