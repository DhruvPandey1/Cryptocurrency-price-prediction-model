import pandas as pd
import yfinance as yf

# Create data directory if it doesn't exist
import os
os.makedirs('./data', exist_ok=True)

# Download data for each cryptocurrency
for symbol in ['BTC', 'ETH', 'XRP', 'LTC', 'ADA']:
    data = yf.download(f"{symbol}-USD", start="2020-01-01")
    data.to_csv(f"./data/{symbol}_USD.csv")
    print(f"Downloaded data for {symbol}")