const Tesseract = require('tesseract.js');
const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

/**
 * OCR Service for processing receipt images and extracting expense data
 * Combines Tesseract.js for offline processing with external OCR APIs for enhanced accuracy
 */

class OCRService {
  constructor() {
    this.tesseractWorker = null;
    this.initializeTesseract();
  }

  async initializeTesseract() {
    try {
      this.tesseractWorker = await Tesseract.createWorker();
      await this.tesseractWorker.loadLanguage('eng');
      await this.tesseractWorker.initialize('eng');
      console.log('✅ Tesseract OCR initialized successfully');
    } catch (error) {
      console.error('❌ Tesseract initialization failed:', error);
    }
  }

  /**
   * Process image with OCR and extract structured data
   * @param {string} imagePath - Path to the image file
   * @param {Object} options - OCR processing options
   * @returns {Object} OCR result with extracted text and parsed data
   */
  async processImage(imagePath, options = {}) {
    try {
      // Preprocess image for better OCR accuracy
      const processedImagePath = await this.preprocessImage(imagePath);

      // Try multiple OCR methods for best results
      const ocrResults = await Promise.allSettled([
        this.processWithTesseract(processedImagePath),
        this.processWithExternalAPI(processedImagePath)
      ]);

      // Choose the best result based on confidence scores
      let bestResult = null;
      let highestConfidence = 0;

      for (const result of ocrResults) {
        if (result.status === 'fulfilled' && result.value.confidence > highestConfidence) {
          highestConfidence = result.value.confidence;
          bestResult = result.value;
        }
      }

      // Fallback to first successful result if no confidence scores
      if (!bestResult) {
        const successfulResult = ocrResults.find(result => result.status === 'fulfilled');
        bestResult = successfulResult ? successfulResult.value : null;
      }

      if (!bestResult) {
        throw new Error('All OCR methods failed');
      }

      // Parse extracted text into structured data
      const parsedData = await this.parseReceiptData(bestResult.extractedText);

      // Clean up processed image
      try {
        await fs.unlink(processedImagePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup processed image:', cleanupError);
      }

      return {
        ...bestResult,
        parsedData,
        processingMethods: ocrResults.map((result, index) => ({
          method: index === 0 ? 'tesseract' : 'external_api',
          status: result.status,
          confidence: result.status === 'fulfilled' ? result.value.confidence : 0
        }))
      };

    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  /**
   * Preprocess image to improve OCR accuracy
   * @param {string} imagePath - Original image path
   * @returns {string} Path to processed image
   */
  async preprocessImage(imagePath) {
    try {
      const processedPath = imagePath.replace(path.extname(imagePath), '_processed.png');

      await sharp(imagePath)
        .resize(null, 1200, { withoutEnlargement: true }) // Increase resolution
        .greyscale() // Convert to grayscale
        .normalize() // Enhance contrast
        .sharpen() // Sharpen edges
        .png({ quality: 100 }) // High quality PNG
        .toFile(processedPath);

      return processedPath;
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      return imagePath; // Return original if preprocessing fails
    }
  }

  /**
   * Process image using Tesseract.js
   * @param {string} imagePath - Path to image
   * @returns {Object} OCR result
   */
  async processWithTesseract(imagePath) {
    try {
      if (!this.tesseractWorker) {
        await this.initializeTesseract();
      }

      const { data } = await this.tesseractWorker.recognize(imagePath);
      
      return {
        extractedText: data.text,
        confidence: data.confidence,
        method: 'tesseract',
        words: data.words?.map(word => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox
        })) || []
      };
    } catch (error) {
      console.error('Tesseract OCR failed:', error);
      throw error;
    }
  }

  /**
   * Process image using external OCR API (OCR.Space)
   * @param {string} imagePath - Path to image
   * @returns {Object} OCR result
   */
  async processWithExternalAPI(imagePath) {
    try {
      if (!process.env.OCR_API_KEY) {
        throw new Error('OCR API key not configured');
      }

      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const response = await axios.post(
        process.env.OCR_SERVICE_URL || 'https://api.ocr.space/parse/image',
        {
          base64Image: `data:image/png;base64,${base64Image}`,
          language: 'eng',
          isOverlayRequired: false,
          detectOrientation: true,
          scale: true,
          OCREngine: 2
        },
        {
          headers: {
            'apikey': process.env.OCR_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data.IsErroredOnProcessing) {
        throw new Error(response.data.ErrorMessage || 'External OCR API failed');
      }

      const extractedText = response.data.ParsedResults?.[0]?.ParsedText || '';
      
      return {
        extractedText,
        confidence: 85, // OCR.Space doesn't provide confidence, use default
        method: 'external_api',
        words: []
      };
    } catch (error) {
      console.error('External OCR API failed:', error);
      throw error;
    }
  }

  /**
   * Parse extracted text to identify receipt data
   * @param {string} text - Raw OCR text
   * @returns {Object} Parsed receipt data
   */
  async parseReceiptData(text) {
    try {
      const parsedData = {
        amount: null,
        date: null,
        vendor: null,
        category: null,
        items: []
      };

      // Clean and normalize text
      const normalizedText = text.replace(/[^\w\s\d.,\-\/\$€£¥]/g, ' ').replace(/\s+/g, ' ').trim();
      const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      // Extract total amount (various patterns)
      const amountPatterns = [
        /(?:total|amount|sum|charge|bill)[\s:]*\$?([0-9]+[.,][0-9]{2})/i,
        /\$([0-9]+[.,][0-9]{2})/g,
        /([0-9]+[.,][0-9]{2})\s*(?:total|amount|sum|charge|bill)/i,
        /(?:^|\s)([0-9]+[.,][0-9]{2})(?:\s|$)/g
      ];

      for (const pattern of amountPatterns) {
        const matches = normalizedText.match(pattern);
        if (matches) {
          const amounts = matches.map(match => {
            const numStr = match.replace(/[^\d.,]/g, '');
            return parseFloat(numStr.replace(',', '.'));
          }).filter(num => num > 0 && num < 10000); // Reasonable range

          if (amounts.length > 0) {
            parsedData.amount = Math.max(...amounts); // Take the largest amount (likely total)
            break;
          }
        }
      }

      // Extract date (various formats)
      const datePatterns = [
        /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/g,
        /\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/g,
        /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4}/gi,
        /\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4}/gi
      ];

      for (const pattern of datePatterns) {
        const matches = normalizedText.match(pattern);
        if (matches) {
          for (const match of matches) {
            const date = this.parseDate(match);
            if (date && date <= new Date()) { // Must be in the past
              parsedData.date = date;
              break;
            }
          }
          if (parsedData.date) break;
        }
      }

      // Extract vendor/merchant name (usually at the top of receipt)
      const topLines = lines.slice(0, 5);
      for (const line of topLines) {
        if (line.length > 2 && line.length < 50 && !this.isNumeric(line)) {
          // Skip common receipt terms
          const skipTerms = ['receipt', 'invoice', 'bill', 'thank you', 'customer copy'];
          if (!skipTerms.some(term => line.toLowerCase().includes(term))) {
            parsedData.vendor = this.cleanVendorName(line);
            break;
          }
        }
      }

      // Predict category based on vendor and content
      parsedData.category = this.predictCategory(normalizedText, parsedData.vendor);

      // Extract line items
      parsedData.items = this.extractLineItems(lines);

      return parsedData;

    } catch (error) {
      console.error('Receipt parsing failed:', error);
      return {
        amount: null,
        date: null,
        vendor: null,
        category: null,
        items: []
      };
    }
  }

  /**
   * Parse date string into Date object
   * @param {string} dateStr - Date string from OCR
   * @returns {Date|null} Parsed date or null
   */
  parseDate(dateStr) {
    try {
      // Try various date formats
      const formats = [
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/, // MM/DD/YYYY or DD/MM/YYYY
        /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/, // YYYY/MM/DD
      ];

      for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
          let [, part1, part2, part3] = match;
          
          // Handle 2-digit years
          if (part3.length === 2) {
            part3 = parseInt(part3) < 50 ? `20${part3}` : `19${part3}`;
          }

          // Try different date interpretations
          const dates = [
            new Date(part3, part1 - 1, part2), // YYYY, MM-1, DD
            new Date(part3, part2 - 1, part1), // YYYY, DD-1, MM
            new Date(part1, part2 - 1, part3), // MM, DD-1, YYYY (if part1 is year)
          ];

          for (const date of dates) {
            if (!isNaN(date.getTime()) && date.getFullYear() >= 2000 && date.getFullYear() <= new Date().getFullYear()) {
              return date;
            }
          }
        }
      }

      // Try natural language parsing
      const date = new Date(dateStr);
      if (!isNaN(date.getTime()) && date.getFullYear() >= 2000) {
        return date;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clean and format vendor name
   * @param {string} rawName - Raw vendor name from OCR
   * @returns {string} Cleaned vendor name
   */
  cleanVendorName(rawName) {
    return rawName
      .replace(/[^\w\s&'-]/g, '') // Remove special chars except &, ', -
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Predict expense category based on vendor and content
   * @param {string} text - Full OCR text
   * @param {string} vendor - Vendor name
   * @returns {string} Predicted category
   */
  predictCategory(text, vendor) {
    const categories = {
      'Travel': ['airline', 'flight', 'airport', 'hotel', 'motel', 'car rental', 'uber', 'lyft', 'taxi', 'train', 'bus'],
      'Meals': ['restaurant', 'cafe', 'coffee', 'food', 'dining', 'lunch', 'dinner', 'breakfast', 'mcdonald', 'starbucks', 'pizza'],
      'Transportation': ['gas', 'fuel', 'parking', 'toll', 'metro', 'subway', 'public transport'],
      'Office Supplies': ['office', 'supplies', 'paper', 'pen', 'staples', 'printer', 'ink'],
      'Software': ['software', 'license', 'subscription', 'app', 'microsoft', 'adobe', 'google'],
      'Accommodation': ['hotel', 'motel', 'inn', 'lodge', 'resort', 'airbnb'],
      'Marketing': ['advertising', 'marketing', 'promotion', 'banner', 'flyer'],
      'Training': ['training', 'course', 'education', 'seminar', 'workshop', 'conference'],
      'Client Entertainment': ['entertainment', 'theater', 'movie', 'concert', 'event']
    };

    const lowerText = text.toLowerCase();
    const lowerVendor = vendor ? vendor.toLowerCase() : '';

    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword) || lowerVendor.includes(keyword)) {
          return category;
        }
      }
    }

    return 'Other';
  }

  /**
   * Extract line items from receipt
   * @param {Array} lines - Array of text lines
   * @returns {Array} Array of line items
   */
  extractLineItems(lines) {
    const items = [];
    
    for (const line of lines) {
      // Look for lines with item description and price
      const itemMatch = line.match(/^(.+?)\s+([0-9]+[.,][0-9]{2})$/);
      if (itemMatch) {
        const [, description, price] = itemMatch;
        if (description.length > 2 && description.length < 100) {
          items.push({
            description: description.trim(),
            totalPrice: parseFloat(price.replace(',', '.')),
            quantity: 1,
            unitPrice: parseFloat(price.replace(',', '.'))
          });
        }
      }
    }

    return items.slice(0, 20); // Limit to 20 items
  }

  /**
   * Check if string is numeric
   * @param {string} str - String to check
   * @returns {boolean} True if numeric
   */
  isNumeric(str) {
    return /^\d+[.,]?\d*$/.test(str.replace(/\s/g, ''));
  }

  /**
   * Cleanup method to properly close Tesseract worker
   */
  async cleanup() {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
    }
  }
}

// Create singleton instance
const ocrService = new OCRService();

// Export the main processing function
const processOCR = async (imagePath, options = {}) => {
  return await ocrService.processImage(imagePath, options);
};

// Export cleanup function for graceful shutdown
const cleanupOCR = async () => {
  return await ocrService.cleanup();
};

module.exports = {
  processOCR,
  cleanupOCR,
  OCRService
};