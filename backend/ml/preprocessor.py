import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import pickle
import os

class CryptoPreprocessor:
    def __init__(self):
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.look_back = 60  # 60 days of historical data for prediction
        
    def create_dataset(self, dataset, look_back=60):
        """Convert an array of values into a dataset matrix"""
        X, y = [], []
        for i in range(len(dataset) - look_back):
            X.append(dataset[i:(i + look_back), :])
            y.append(dataset[i + look_back, 0])  # We predict the closing price
        return np.array(X), np.array(y)
    
    def preprocess(self, df, symbol, save_scaler=True):
        """Preprocess cryptocurrency data"""
        # Extract relevant features
        data = df[['Open', 'High', 'Low', 'Close', 'Volume']].values
        
        # Scale the data
        scaled_data = self.scaler.fit_transform(data)
        
        # Create sequences
        X, y = self.create_dataset(scaled_data, self.look_back)
        
        # Save the scaler for future use
        if save_scaler:
            os.makedirs('./models', exist_ok=True)
            with open(f'./models/scaler_{symbol}.pkl', 'wb') as f:
                pickle.dump(self.scaler, f)
        
        # Training/validation split (80% training, 20% validation)
        train_size = int(len(X) * 0.8)
        X_train, X_val = X[:train_size], X[train_size:]
        y_train, y_val = y[:train_size], y[train_size:]
        
        return X_train, X_val, y_train, y_val
    
    def load_scaler(self, symbol):
        """Load saved scaler for predictions"""
        with open(f'./models/scaler_{symbol}.pkl', 'rb') as f:
            self.scaler = pickle.load(f)
        return self.scaler
    
    def prepare_prediction_data(self, df, symbol):
        """Prepare data for prediction"""
        # Load the scaler
        self.load_scaler(symbol)
        
        # Extract features
        data = df[['open', 'high', 'low', 'close', 'volume']].values
        
        # Scale the data
        scaled_data = self.scaler.transform(data)
        
        # Use the last look_back days for prediction
        prediction_data = scaled_data[-self.look_back:].reshape(1, self.look_back, 5)
        
        return prediction_data