import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
import os
from preprocessor import CryptoPreprocessor

class CryptoLSTMModel:
    def __init__(self, symbol, look_back=60):
        """Initialize LSTM model for crypto prediction"""
        self.symbol = symbol
        self.look_back = look_back
        self.preprocessor = CryptoPreprocessor()
        self.model = self._build_model()
        
    def _build_model(self):
        """Build LSTM model architecture"""
        model = Sequential()
        
        # First LSTM layer
        model.add(LSTM(units=50, 
                       return_sequences=True, 
                       input_shape=(self.look_back, 5)))
        model.add(Dropout(0.2))
        
        # Second LSTM layer
        model.add(LSTM(units=50, 
                       return_sequences=True))
        model.add(Dropout(0.2))
        
        # Third LSTM layer
        model.add(LSTM(units=50))
        model.add(Dropout(0.2))
        
        # Output layer
        model.add(Dense(units=1))
        
        # Compile model
        model.compile(optimizer='adam', loss='mean_squared_error')
        
        return model
    
    def train(self, X_train, y_train, X_val, y_val, epochs=100, batch_size=32):
        """Train the LSTM model"""
        # Create model directory if it doesn't exist
        os.makedirs('./models', exist_ok=True)
        
        # Define callbacks
        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        )
        
        model_checkpoint = ModelCheckpoint(
            filepath=f'./models/model_{self.symbol}.h5',
            monitor='val_loss',
            save_best_only=True
        )
        
        # Train the model
        history = self.model.fit(
            X_train, y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_data=(X_val, y_val),
            callbacks=[early_stopping, model_checkpoint],
            verbose=1
        )
        
        return history
    
    def save_model(self):
        """Save the trained model"""
        self.model.save(f'./models/model_{self.symbol}.h5')
        print(f"Model saved to ./models/model_{self.symbol}.h5")
    
    def load_model(self):
        """Load a trained model"""
        self.model = tf.keras.models.load_model(f'./models/model_{self.symbol}.h5')
        return self.model
    
    def predict(self, prediction_data):
        """Make a prediction using the trained model"""
        prediction = self.model.predict(prediction_data)
        
        # Get the scaler to inverse transform the prediction
        scaler = self.preprocessor.load_scaler(self.symbol)
        
        # Create a dummy array with the same shape as the original data
        dummy = np.zeros((1, 5))
        dummy[0, 0] = prediction[0, 0]  # Set the closing price prediction
        
        # Inverse transform to get the actual price
        prediction_inv = scaler.inverse_transform(dummy)
        
        return prediction_inv[0, 0]  # Return the predicted closing price
    
    def evaluate(self, X_test, y_test):
        """Evaluate model performance"""
        # Predict using test data
        y_pred = self.model.predict(X_test)
        
        # Get the scaler
        scaler = self.preprocessor.load_scaler(self.symbol)
        
        # Inverse transform predictions and actual values
        dummy_pred = np.zeros((len(y_pred), 5))
        dummy_actual = np.zeros((len(y_test), 5))
        
        dummy_pred[:, 0] = y_pred.flatten()
        dummy_actual[:, 0] = y_test
        
        y_pred_inv = scaler.inverse_transform(dummy_pred)[:, 0]
        y_test_inv = scaler.inverse_transform(dummy_actual)[:, 0]
        
        # Calculate metrics
        mse = np.mean((y_pred_inv - y_test_inv) ** 2)
        rmse = np.sqrt(mse)
        mae = np.mean(np.abs(y_pred_inv - y_test_inv))
        
        return {
            'MSE': mse,
            'RMSE': rmse,
            'MAE': mae
        }