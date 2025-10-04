const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * @swagger
 * /api/currency/rates:
 *   get:
 *     summary: Get current currency exchange rates
 *     tags: [Currency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: base
 *         schema:
 *           type: string
 *           default: USD
 *         description: Base currency code
 *       - in: query
 *         name: target
 *         schema:
 *           type: string
 *         description: Target currency code (if not provided, returns all rates)
 *     responses:
 *       200:
 *         description: Exchange rates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     base:
 *                       type: string
 *                     date:
 *                       type: string
 *                     rates:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: External API error
 */
router.get('/rates', async (req, res) => {
  try {
    const { base = 'USD', target } = req.query;
    
    // Get exchange rates from external API
    const rates = await getExchangeRates(base, target);
    
    res.json({
      success: true,
      data: rates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching exchange rates',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/currency/convert:
 *   post:
 *     summary: Convert amount between currencies
 *     tags: [Currency]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - from
 *               - to
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to convert
 *               from:
 *                 type: string
 *                 description: Source currency code
 *               to:
 *                 type: string
 *                 description: Target currency code
 *     responses:
 *       200:
 *         description: Currency conversion completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     originalAmount:
 *                       type: number
 *                     convertedAmount:
 *                       type: number
 *                     fromCurrency:
 *                       type: string
 *                     toCurrency:
 *                       type: string
 *                     exchangeRate:
 *                       type: number
 *                     date:
 *                       type: string
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 */
router.post('/convert', async (req, res) => {
  try {
    const { amount, from, to } = req.body;

    if (!amount || !from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Amount, from currency, and to currency are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero'
      });
    }

    // Get exchange rate
    const rates = await getExchangeRates(from, to);
    const exchangeRate = rates.rates[to];

    if (!exchangeRate) {
      return res.status(400).json({
        success: false,
        message: `Exchange rate not available for ${from} to ${to}`
      });
    }

    const convertedAmount = Math.round((amount * exchangeRate) * 100) / 100;

    res.json({
      success: true,
      data: {
        originalAmount: amount,
        convertedAmount,
        fromCurrency: from,
        toCurrency: to,
        exchangeRate,
        date: new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error converting currency',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/currency/supported:
 *   get:
 *     summary: Get list of supported currencies
 *     tags: [Currency]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Supported currencies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       symbol:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/supported', async (req, res) => {
  try {
    const supportedCurrencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
      { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
      { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
      { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
      { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
      { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
      { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
      { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
      { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
      { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' }
    ];

    res.json({
      success: true,
      data: supportedCurrencies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching supported currencies',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/currency/historical:
 *   get:
 *     summary: Get historical exchange rates
 *     tags: [Currency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: base
 *         schema:
 *           type: string
 *           default: USD
 *         description: Base currency code
 *       - in: query
 *         name: target
 *         required: true
 *         schema:
 *           type: string
 *         description: Target currency code
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Historical date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Historical exchange rate retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/historical', async (req, res) => {
  try {
    const { base = 'USD', target, date } = req.query;

    if (!target || !date) {
      return res.status(400).json({
        success: false,
        message: 'Target currency and date are required'
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Get historical rates
    const historicalRates = await getHistoricalRates(base, target, date);
    
    res.json({
      success: true,
      data: historicalRates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching historical exchange rates',
      error: error.message
    });
  }
});

// Helper functions
async function getExchangeRates(base = 'USD', target = null) {
  try {
    // Mock implementation - replace with actual API call
    const mockRates = {
      USD: { EUR: 0.85, GBP: 0.73, JPY: 110.0, CAD: 1.25, AUD: 1.35 },
      EUR: { USD: 1.18, GBP: 0.86, JPY: 129.0, CAD: 1.47, AUD: 1.59 },
      GBP: { USD: 1.37, EUR: 1.16, JPY: 150.0, CAD: 1.71, AUD: 1.85 }
    };

    const rates = mockRates[base] || mockRates.USD;
    
    if (target && rates[target]) {
      return {
        base,
        date: new Date().toISOString().split('T')[0],
        rates: { [target]: rates[target] }
      };
    }

    return {
      base,
      date: new Date().toISOString().split('T')[0],
      rates
    };

    // Real implementation would use:
    // const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    // const url = `https://api.exchangerate-api.com/v4/latest/${base}`;
    // const response = await axios.get(url);
    // return response.data;

  } catch (error) {
    throw new Error(`Failed to fetch exchange rates: ${error.message}`);
  }
}

async function getHistoricalRates(base, target, date) {
  try {
    // Mock implementation - replace with actual API call
    const mockRate = Math.random() * 0.1 + 0.8; // Random rate around 0.8-0.9
    
    return {
      base,
      date,
      rates: { [target]: mockRate }
    };

    // Real implementation would use:
    // const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    // const url = `https://api.exchangerate-api.com/v4/history/${base}/${date}`;
    // const response = await axios.get(url);
    // return response.data;

  } catch (error) {
    throw new Error(`Failed to fetch historical rates: ${error.message}`);
  }
}

module.exports = router;