const axios = require('axios');
const redis = require('redis');

/**
 * Currency Service for real-time currency conversion
 * Includes caching, fallback rates, and multiple API providers
 */

class CurrencyService {
  constructor() {
    this.redisClient = null;
    this.initializeRedis();
    this.exchangeRateCache = new Map(); // In-memory fallback cache
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour
    this.lastFetchTime = new Map();
  }

  async initializeRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redisClient = redis.createClient({
          url: process.env.REDIS_URL
        });
        
        this.redisClient.on('error', (err) => {
          console.error('Redis Client Error:', err);
        });
        
        await this.redisClient.connect();
        console.log('✅ Redis connected for currency caching');
      }
    } catch (error) {
      console.warn('⚠️  Redis not available, using in-memory cache for currencies');
    }
  }

  /**
   * Convert currency with caching and fallback options
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Target currency code
   * @returns {Object} Conversion result with rate and converted amount
   */
  async convertCurrency(amount, fromCurrency, toCurrency) {
    try {
      // No conversion needed if currencies are the same
      if (fromCurrency === toCurrency) {
        return {
          originalAmount: amount,
          convertedAmount: amount,
          exchangeRate: 1,
          fromCurrency,
          toCurrency,
          timestamp: new Date(),
          source: 'no_conversion'
        };
      }

      // Get exchange rate
      const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = parseFloat((amount * exchangeRate).toFixed(2));

      return {
        originalAmount: amount,
        convertedAmount,
        exchangeRate,
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        timestamp: new Date(),
        source: 'live_rate'
      };

    } catch (error) {
      console.error('Currency conversion failed:', error);
      
      // Fallback to approximate rates if live conversion fails
      const fallbackRate = this.getFallbackRate(fromCurrency, toCurrency);
      const convertedAmount = parseFloat((amount * fallbackRate).toFixed(2));

      return {
        originalAmount: amount,
        convertedAmount,
        exchangeRate: fallbackRate,
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        timestamp: new Date(),
        source: 'fallback_rate',
        warning: 'Live exchange rate unavailable, using approximate rate'
      };
    }
  }

  /**
   * Get exchange rate between two currencies
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {number} Exchange rate
   */
  async getExchangeRate(fromCurrency, toCurrency) {
    const cacheKey = `${fromCurrency}_${toCurrency}`;
    
    // Check cache first
    const cachedRate = await this.getCachedRate(cacheKey);
    if (cachedRate) {
      return cachedRate;
    }

    // Fetch live rate
    const liveRate = await this.fetchLiveRate(fromCurrency, toCurrency);
    
    // Cache the rate
    await this.setCachedRate(cacheKey, liveRate);
    
    return liveRate;
  }

  /**
   * Get cached exchange rate
   * @param {string} cacheKey - Cache key for currency pair
   * @returns {number|null} Cached rate or null
   */
  async getCachedRate(cacheKey) {
    try {
      // Try Redis first
      if (this.redisClient) {
        const cached = await this.redisClient.get(`exchange_rate:${cacheKey}`);
        if (cached) {
          const data = JSON.parse(cached);
          if (Date.now() - data.timestamp < this.cacheExpiry) {
            return data.rate;
          }
        }
      }

      // Fallback to in-memory cache
      const cached = this.exchangeRateCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.rate;
      }

      return null;
    } catch (error) {
      console.error('Error getting cached rate:', error);
      return null;
    }
  }

  /**
   * Cache exchange rate
   * @param {string} cacheKey - Cache key
   * @param {number} rate - Exchange rate
   */
  async setCachedRate(cacheKey, rate) {
    try {
      const data = {
        rate,
        timestamp: Date.now()
      };

      // Cache in Redis
      if (this.redisClient) {
        await this.redisClient.setEx(
          `exchange_rate:${cacheKey}`,
          3600, // 1 hour
          JSON.stringify(data)
        );
      }

      // Cache in memory as fallback
      this.exchangeRateCache.set(cacheKey, data);
    } catch (error) {
      console.error('Error caching rate:', error);
    }
  }

  /**
   * Fetch live exchange rate from API
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {number} Live exchange rate
   */
  async fetchLiveRate(fromCurrency, toCurrency) {
    const apiProviders = [
      this.fetchFromExchangeRateAPI.bind(this),
      this.fetchFromFixer.bind(this),
      this.fetchFromCurrencyAPI.bind(this)
    ];

    for (const provider of apiProviders) {
      try {
        const rate = await provider(fromCurrency, toCurrency);
        if (rate && rate > 0) {
          return rate;
        }
      } catch (error) {
        console.warn(`Currency API provider failed:`, error.message);
        continue;
      }
    }

    throw new Error('All currency API providers failed');
  }

  /**
   * Fetch rate from ExchangeRate-API
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {number} Exchange rate
   */
  async fetchFromExchangeRateAPI(fromCurrency, toCurrency) {
    const url = `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`;
    const response = await axios.get(url, { timeout: 5000 });
    
    if (response.data && response.data.rates && response.data.rates[toCurrency]) {
      return response.data.rates[toCurrency];
    }
    
    throw new Error(`Rate not found for ${fromCurrency} to ${toCurrency}`);
  }

  /**
   * Fetch rate from Fixer.io (requires API key)
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {number} Exchange rate
   */
  async fetchFromFixer(fromCurrency, toCurrency) {
    if (!process.env.FIXER_API_KEY) {
      throw new Error('Fixer API key not configured');
    }

    const url = `http://data.fixer.io/api/latest?access_key=${process.env.FIXER_API_KEY}&base=${fromCurrency}&symbols=${toCurrency}`;
    const response = await axios.get(url, { timeout: 5000 });
    
    if (response.data && response.data.success && response.data.rates && response.data.rates[toCurrency]) {
      return response.data.rates[toCurrency];
    }
    
    throw new Error(`Fixer API failed for ${fromCurrency} to ${toCurrency}`);
  }

  /**
   * Fetch rate from CurrencyAPI
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {number} Exchange rate
   */
  async fetchFromCurrencyAPI(fromCurrency, toCurrency) {
    if (!process.env.CURRENCY_API_KEY) {
      throw new Error('Currency API key not configured');
    }

    const url = `https://api.currencyapi.com/v3/latest?apikey=${process.env.CURRENCY_API_KEY}&base_currency=${fromCurrency}&currencies=${toCurrency}`;
    const response = await axios.get(url, { timeout: 5000 });
    
    if (response.data && response.data.data && response.data.data[toCurrency]) {
      return response.data.data[toCurrency].value;
    }
    
    throw new Error(`CurrencyAPI failed for ${fromCurrency} to ${toCurrency}`);
  }

  /**
   * Get fallback exchange rate when APIs are unavailable
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {number} Approximate exchange rate
   */
  getFallbackRate(fromCurrency, toCurrency) {
    // Static fallback rates (approximate, updated periodically)
    const fallbackRates = {
      // USD base rates
      'USD_EUR': 0.85,
      'USD_GBP': 0.73,
      'USD_JPY': 110.0,
      'USD_CAD': 1.25,
      'USD_AUD': 1.35,
      'USD_CHF': 0.92,
      'USD_CNY': 6.45,
      'USD_INR': 74.5,
      'USD_SGD': 1.35,
      'USD_HKD': 7.8,
      'USD_SEK': 8.6,
      'USD_NOK': 8.8,
      'USD_DKK': 6.4,
      'USD_NZD': 1.42,
      'USD_KRW': 1180.0,
      'USD_BRL': 5.2,
      'USD_MXN': 20.1,
      'USD_ZAR': 14.8,
      
      // EUR base rates
      'EUR_USD': 1.18,
      'EUR_GBP': 0.86,
      'EUR_JPY': 129.5,
      'EUR_CHF': 1.08,
      
      // GBP base rates
      'GBP_USD': 1.37,
      'GBP_EUR': 1.16,
      'GBP_JPY': 150.7,
      
      // Cross rates
      'CAD_USD': 0.80,
      'AUD_USD': 0.74,
      'JPY_USD': 0.0091,
      'CHF_USD': 1.09,
      'CNY_USD': 0.155,
      'INR_USD': 0.0134
    };

    const key = `${fromCurrency}_${toCurrency}`;
    const reverseKey = `${toCurrency}_${fromCurrency}`;

    if (fallbackRates[key]) {
      return fallbackRates[key];
    } else if (fallbackRates[reverseKey]) {
      return 1 / fallbackRates[reverseKey];
    }

    // If direct rate not available, try via USD
    const fromToUSD = fallbackRates[`${fromCurrency}_USD`];
    const usdTo = fallbackRates[`USD_${toCurrency}`];
    
    if (fromToUSD && usdTo) {
      return fromToUSD * usdTo;
    }

    const usdFrom = fallbackRates[`USD_${fromCurrency}`];
    const toToUSD = fallbackRates[`${toCurrency}_USD`];
    
    if (usdFrom && toToUSD) {
      return (1 / usdFrom) * (1 / toToUSD);
    }

    // Last resort: return 1 (no conversion)
    console.warn(`No fallback rate available for ${fromCurrency} to ${toCurrency}`);
    return 1;
  }

  /**
   * Get supported currencies
   * @returns {Array} Array of supported currency codes
   */
  getSupportedCurrencies() {
    return [
      'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY',
      'INR', 'SGD', 'HKD', 'SEK', 'NOK', 'DKK', 'NZD', 'KRW',
      'BRL', 'MXN', 'ZAR', 'RUB', 'PLN', 'CZK', 'HUF', 'BGN',
      'RON', 'HRK', 'TRY', 'ILS', 'CLP', 'PHP', 'MYR', 'THB',
      'IDR', 'VND', 'EGP', 'MAD', 'NGN', 'KES', 'GHS', 'UGX'
    ];
  }

  /**
   * Get currency info including name and symbol
   * @param {string} currencyCode - Currency code
   * @returns {Object} Currency information
   */
  getCurrencyInfo(currencyCode) {
    const currencyData = {
      'USD': { name: 'US Dollar', symbol: '$' },
      'EUR': { name: 'Euro', symbol: '€' },
      'GBP': { name: 'British Pound', symbol: '£' },
      'JPY': { name: 'Japanese Yen', symbol: '¥' },
      'CAD': { name: 'Canadian Dollar', symbol: 'C$' },
      'AUD': { name: 'Australian Dollar', symbol: 'A$' },
      'CHF': { name: 'Swiss Franc', symbol: 'CHF' },
      'CNY': { name: 'Chinese Yuan', symbol: '¥' },
      'INR': { name: 'Indian Rupee', symbol: '₹' },
      'SGD': { name: 'Singapore Dollar', symbol: 'S$' },
      'HKD': { name: 'Hong Kong Dollar', symbol: 'HK$' },
      'SEK': { name: 'Swedish Krona', symbol: 'kr' },
      'NOK': { name: 'Norwegian Krone', symbol: 'kr' },
      'DKK': { name: 'Danish Krone', symbol: 'kr' },
      'NZD': { name: 'New Zealand Dollar', symbol: 'NZ$' },
      'KRW': { name: 'South Korean Won', symbol: '₩' },
      'BRL': { name: 'Brazilian Real', symbol: 'R$' },
      'MXN': { name: 'Mexican Peso', symbol: '$' },
      'ZAR': { name: 'South African Rand', symbol: 'R' }
    };

    return currencyData[currencyCode] || { 
      name: currencyCode, 
      symbol: currencyCode 
    };
  }

  /**
   * Validate currency code
   * @param {string} currencyCode - Currency code to validate
   * @returns {boolean} True if valid
   */
  isValidCurrency(currencyCode) {
    return this.getSupportedCurrencies().includes(currencyCode.toUpperCase());
  }

  /**
   * Get historical exchange rates (mock implementation)
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Historical rates
   */
  async getHistoricalRates(fromCurrency, toCurrency, startDate, endDate) {
    // This is a mock implementation
    // In production, you would integrate with a service like Alpha Vantage or similar
    const currentRate = await this.getExchangeRate(fromCurrency, toCurrency);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    const historicalRates = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const rate = currentRate * (1 + variation);
      
      historicalRates.push({
        date: date.toISOString().split('T')[0],
        rate: parseFloat(rate.toFixed(6)),
        fromCurrency,
        toCurrency
      });
    }
    
    return historicalRates;
  }

  /**
   * Cleanup method
   */
  async cleanup() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

// Create singleton instance
const currencyService = new CurrencyService();

// Export the main functions
const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  return await currencyService.convertCurrency(amount, fromCurrency, toCurrency);
};

const getExchangeRate = async (fromCurrency, toCurrency) => {
  return await currencyService.getExchangeRate(fromCurrency, toCurrency);
};

const getSupportedCurrencies = () => {
  return currencyService.getSupportedCurrencies();
};

const getCurrencyInfo = (currencyCode) => {
  return currencyService.getCurrencyInfo(currencyCode);
};

const isValidCurrency = (currencyCode) => {
  return currencyService.isValidCurrency(currencyCode);
};

const getHistoricalRates = async (fromCurrency, toCurrency, startDate, endDate) => {
  return await currencyService.getHistoricalRates(fromCurrency, toCurrency, startDate, endDate);
};

module.exports = {
  convertCurrency,
  getExchangeRate,
  getSupportedCurrencies,
  getCurrencyInfo,
  isValidCurrency,
  getHistoricalRates,
  CurrencyService
};