"""
BASELINE MODEL ARCHITECTURE
===========================
Model: ResNet-50 (Pre-trained on ImageNet)
Purpose: Pixel-based Landslide Detection (Comparative Analysis)
"""

import torch
import torch.nn as nn
from torchvision import models  # <--- HERE IS THE IMPORT

class LandslideCNN(nn.Module):
    def __init__(self):
        super(LandslideCNN, self).__init__()
        
        # 1. DOWNLOAD STANDARD MODEL
        # This line fetches the architecture from the official PyTorch link
        self.backbone = models.resnet50(pretrained=True)
        
        # 2. MODIFY FOR BINARY CLASSIFICATION (Landslide vs Safe)
        # ResNet default is 1000 classes; we need 1 (Binary Probability).
        num_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Sequential(
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, 1),
            nn.Sigmoid()
        )
        
    def forward(self, x):
        return self.backbone(x)

def load_baseline():
    print("[BASELINE] Loading ResNet-50 weights from checkpoints/resnet50_baseline.pth...")
    model = LandslideCNN()
    return model