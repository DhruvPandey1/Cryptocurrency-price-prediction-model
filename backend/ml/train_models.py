# train_models.py - corrected version
import pandas as pd
import numpy as np
import os
from model import CryptoLSTMModel
from preprocessor import CryptoPreprocessor
import matplotlib.pyplot as plt

# Create directories
os.makedirs('./data', exist_ok=True)
os.makedirs('./models', exist_ok=True)

# List of cryptocurrencies to train models for
cryptocurrencies = ['BTC', 'ETH', 'XRP', 'LTC', 'ADA']

for symbol in cryptocurrencies:
    print(f"Training model for {symbol}...")
    
    try:
        # Load data
        file_path = f'./data/{symbol}_USD.csv'
        if not os.path.exists(file_path):
            print(f"Data file {file_path} not found. Skipping {symbol}.")
            continue
            
        df = pd.read_csv(file_path)
        
        # Initialize preprocessor
        preprocessor = CryptoPreprocessor()
        
        # Use the actual preprocess method that exists
        X_train, X_val, y_train, y_val = preprocessor.preprocess(df, symbol)
        
        # Initialize and train model
        model = CryptoLSTMModel(symbol)
        history = model.train(X_train, y_train, X_val, y_val, epochs=50, batch_size=32)
        
        # Save the model
        model.save_model()
        import matplotlib.pyplot as plt

# After model training, assuming you have history object
        plt.figure(figsize=(12, 4))
        plt.plot(history.history['loss'], label='Training Loss')
        plt.plot(history.history['val_loss'], label='Validation Loss')
        plt.title('Model Loss')
        plt.xlabel('Epoch')
        plt.ylabel('Loss')
        plt.legend()
        plt.grid(True)
        plt.show()
        
        # Evaluate model
        # We need to adapt this part as your preprocessor doesn't have a method
        # that returns X_test and y_test specifically
        print(f"Model for {symbol} trained and saved successfully.")
        
    except Exception as e:
        print(f"Error training model for {symbol}: {e}")