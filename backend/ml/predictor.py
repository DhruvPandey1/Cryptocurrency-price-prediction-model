import pandas as pd
import numpy as np
import tensorflow as tf
from model import CryptoLSTMModel
from preprocessor import CryptoPreprocessor
import json
import os

class CryptoPredictor:
    def __init__(self, symbol):
        self.symbol = symbol
        self.model = CryptoLSTMModel(symbol)
        self.preprocessor = CryptoPreprocessor()
        
    def load_model(self):
        """Load the trained model"""
        self.model.load_model()
    
    def predict_next_day(self, data):
        """Predict the next day's price"""
        # Prepare data for prediction
        prediction_data = self.preprocessor.prepare_prediction_data(data, self.symbol)
        
        # Make prediction
        predicted_price = self.model.predict(prediction_data)
        
        # Calculate confidence (basic implementation)
        confidence = 0.75  # In a real-world scenario, this would be calculated based on model metrics
        
        return {
            'symbol': self.symbol,
            'predictedPrice': float(predicted_price),
            'confidence': confidence,
            'date': pd.Timestamp.now().date().isoformat()
        }

def main():
    # Symbols to predict
    symbols = ['BTC', 'ETH', 'XRP', 'LTC', 'ADA']
    predictions = []
    
    for symbol in symbols:
        try:
            # Load recent data (last 100 days)
            data = pd.read_csv(f'./data/{symbol}_USD.csv')
            data = data.tail(100)  # Use last 100 days
            
            # Create predictor
            predictor = CryptoPredictor(symbol)
            predictor.load_model()
            
            # Make prediction
            prediction = predictor.predict_next_day(data)
            predictions.append(prediction)
            
            print(f"Prediction for {symbol}: ${prediction['predictedPrice']:.2f}")
            
        except Exception as e:
            print(f"Error predicting for {symbol}: {str(e)}")
    
    # Save predictions to file
    os.makedirs('./predictions', exist_ok=True)
    with open('./predictions/latest_predictions.json', 'w') as f:
        json.dump(predictions, f)
    
    print("All predictions saved to ./predictions/latest_predictions.json")

if __name__ == "__main__":
    main()