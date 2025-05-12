# File: backend/api.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union
import tensorflow as tf
import numpy as np
import os

app = FastAPI(title="Crypto Prediction API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Define supported cryptocurrencies
SUPPORTED_SYMBOLS = ['BTC', 'ETH', 'XRP', 'LTC', 'ADA']

# Data models
class PredictionInput(BaseModel):
    symbol: str
    input: List[List[float]]

class PredictionOutput(BaseModel):
    symbol: str
    prediction: List[float]


class PredictionDetail(BaseModel):
    id: str
    symbol: str
    date: str
    predicted: float
    actual: Optional[float] = None

# Dictionary to store loaded models
models = {}

# Load models for each cryptocurrency
for symbol in SUPPORTED_SYMBOLS:
    try:
        model_path = f'backend/ml/models/model_{symbol}.h5'
        if os.path.exists(model_path):
            models[symbol] = tf.keras.models.load_model(model_path)
            print(f"Model for {symbol} loaded successfully!")
        else:
            print(f"Model file for {symbol} not found at {model_path}")
    except Exception as e:
        print(f"Error loading model for {symbol}: {e}")

@app.post("/api/predict", response_model=PredictionOutput)
async def predict(data: PredictionInput):
    symbol = data.symbol.upper()
    
    # Check if symbol is supported
    if symbol not in SUPPORTED_SYMBOLS:
        raise HTTPException(status_code=400, detail=f"Symbol {symbol} not supported. Supported symbols: {SUPPORTED_SYMBOLS}")
    
    # Check if model is loaded
    if symbol not in models or models[symbol] is None:
        raise HTTPException(status_code=500, detail=f"Model for {symbol} not loaded")
    
    try:
        # Convert input data to numpy array
        input_array = np.array(data.input)
        
        # Make prediction
        prediction = models[symbol].predict(input_array)
        
        # Return prediction
        return {
            "symbol": symbol,
            "prediction": prediction.tolist()[0]  # Assuming output is batch size 1
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error for {symbol}: {str(e)}")

@app.get("/api/symbols")
async def get_symbols():
    """Get list of supported cryptocurrency symbols"""
    return {
        "symbols": SUPPORTED_SYMBOLS,
        "available": [symbol for symbol in SUPPORTED_SYMBOLS if symbol in models]
    }

@app.get("/api/status")
async def status():
    """Check API status and which models are loaded"""
    return {
        "status": "online",
        "models": {symbol: (symbol in models) for symbol in SUPPORTED_SYMBOLS}
    }

@app.get("/api/predictions/detail/{prediction_id}", response_model=PredictionDetail)
async def get_prediction_by_id(prediction_id: str):
    """Get prediction details by ID"""
    # This is a mock implementation - in a real app you'd fetch from database
    # For now, we'll generate mock data based on the ID
    
    # Extract symbol from ID if possible (assuming format like "BTC-12345")
    parts = prediction_id.split('-')
    symbol = parts[0] if len(parts) > 1 and parts[0] in SUPPORTED_SYMBOLS else "BTC"
    
    return {
        "id": prediction_id,
        "symbol": symbol,
        "date": "2025-04-24",
        "predicted": 85000.00 if symbol == "BTC" else 4500.00,
        "actual": None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)