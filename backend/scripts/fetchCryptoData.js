const axios = require('axios');
const CryptoData = require('../models/CryptoData');
const connectDB = require('../config/db');
require('dotenv').config();

// Connect to MongoDB
connectDB();

const API_KEY = process.env.CRYPTO_API_KEY;
const symbols = ['BTC', 'ETH', 'XRP', 'LTC', 'ADA'];

const fetchData = async () => {
  try {
    for (const symbol of symbols) {
      console.log(`Fetching data for ${symbol}...`);
      
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=${symbol}&market=USD&apikey=${API_KEY}`
      );
      
      // Debug: Check the API response structure
      console.log(`API Response Keys for ${symbol}:`, Object.keys(response.data));
      
      const timeSeriesData = response.data['Time Series (Digital Currency Daily)'];
      
      if (!timeSeriesData) {
        console.error(`No time series data found for ${symbol}. Response:`, response.data);
        continue;
      }
      
      // Debug: Check first entry to understand structure
      const firstDate = Object.keys(timeSeriesData)[0];
      console.log(`Sample data for ${symbol} on ${firstDate}:`, timeSeriesData[firstDate]);
      
      // Process and save data
      for (const [date, data] of Object.entries(timeSeriesData)) {
        // UPDATED: Using the correct keys as shown in the log output
        const openKey = '1. open';
        const highKey = '2. high';
        const lowKey = '3. low';
        const closeKey = '4. close';
        const volumeKey = '5. volume';
        
        // Verify that the keys exist in the data
        if (!data[openKey] || !data[highKey] || !data[lowKey] || !data[closeKey] || !data[volumeKey]) {
          console.error(`Missing required data fields for ${symbol} on ${date}`);
          console.log('Available keys:', Object.keys(data));
          continue;
        }
        
        // Parse the values with error handling
        const open = parseFloat(data[openKey]);
        const high = parseFloat(data[highKey]);
        const low = parseFloat(data[lowKey]);
        const close = parseFloat(data[closeKey]);
        const volume = parseFloat(data[volumeKey]);
        
        // Check for NaN values
        if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close) || isNaN(volume)) {
          console.error(`Invalid numeric values for ${symbol} on ${date}`);
          console.log({
            open: data[openKey],
            high: data[highKey],
            low: data[lowKey],
            close: data[closeKey],
            volume: data[volumeKey]
          });
          continue;
        }
        
        const cryptoData = {
          symbol,
          date: new Date(date),
          open,
          high,
          low,
          close,
          volume
        };
        
        // Use console.log to check what we're sending to the database
        console.log(`Saving cryptoData for ${symbol} on ${date}:`, cryptoData);
        
        try {
          // Use upsert to avoid duplicates
          const result = await CryptoData.findOneAndUpdate(
            { symbol, date: new Date(date) },
            cryptoData,
            { upsert: true, new: true }
          );
          
          // Debug: Check what was actually saved
          console.log(`Saved data for ${symbol} on ${date}:`, result ? 'Success' : 'Failed');
        } catch (dbError) {
          console.error(`Error saving data for ${symbol} on ${date}:`, dbError);
        }
      }
      
      console.log(`Data for ${symbol} saved successfully.`);
      
      // Sleep to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
    
    console.log('All data fetched and saved successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error fetching data:', error);
    process.exit(1);
  }
};

fetchData();
// const axios = require('axios');
// const CryptoData = require('../models/CryptoData');
// const connectDB = require('../config/db');
// require('dotenv').config();

// // Connect to MongoDB
// connectDB();

// const API_KEY = process.env.CRYPTO_API_KEY;
// const symbols = ['BTC', 'ETH', 'XRP', 'LTC', 'ADA'];

// const fetchData = async () => {
//   try {
//     for (const symbol of symbols) {
//       console.log(`Fetching data for ${symbol}...`);
      
//       const response = await axios.get(
//         `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=${symbol}&market=USD&apikey=${API_KEY}`
//       );
      
//       const timeSeriesData = response.data['Time Series (Digital Currency Daily)'];
      
//       // Process and save data
//       for (const [date, data] of Object.entries(timeSeriesData)) {
//         const cryptoData = new CryptoData({
//           symbol,
//           date: new Date(date),
//           open: parseFloat(data['1a. open (USD)']),
//           high: parseFloat(data['2a. high (USD)']),
//           low: parseFloat(data['3a. low (USD)']),
//           close: parseFloat(data['4a. close (USD)']),
//           volume: parseFloat(data['5. volume'])
//         });
        
//         // Use upsert to avoid duplicates
//         await CryptoData.findOneAndUpdate(
//           { symbol, date: new Date(date) },
//           { $set: cryptoData },
//           { upsert: true, new: true }
//         );
//       }
      
//       console.log(`Data for ${symbol} saved successfully.`);
      
//       // Sleep to respect API rate limits
//       await new Promise(resolve => setTimeout(resolve, 15000));
//     }
    
//     console.log('All data fetched and saved successfully.');
//     process.exit(0);
//   } catch (error) {
//     console.error('Error fetching data:', error);
//     process.exit(1);
//   }
// };

// fetchData();