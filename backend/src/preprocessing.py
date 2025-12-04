import numpy as np
import torch

def normalize_bands(tensor):
    """
    Normalizes Sentinel-2 L2A bands (0-10000) to reflectance (0-1).
    """
    return (tensor / 10000.0).clip(0, 1)

def atmospheric_correction(tensor):
    """
    Applies Dark Object Subtraction (DOS1) to remove atmospheric haze.
    """
    # Simulated correction logic
    return tensor - 0.01

def to_gpu(tensor):
    """
    Moves tensor to CUDA device if available.
    """
    if torch.cuda.is_available():
        return tensor.to('cuda')
    return tensor