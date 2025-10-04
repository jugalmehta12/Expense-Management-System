const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/receipts';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  }
});

/**
 * @swagger
 * /api/ocr/process:
 *   post:
 *     summary: Process receipt using OCR
 *     tags: [OCR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               receipt:
 *                 type: string
 *                 format: binary
 *                 description: Receipt image file (JPEG, PNG) or PDF
 *     responses:
 *       200:
 *         description: OCR processing completed successfully
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
 *                     filename:
 *                       type: string
 *                     extractedText:
 *                       type: string
 *                     extractedData:
 *                       type: object
 *                       properties:
 *                         merchantName:
 *                           type: string
 *                         amount:
 *                           type: number
 *                         date:
 *                           type: string
 *                         category:
 *                           type: string
 *                         items:
 *                           type: array
 *                           items:
 *                             type: string
 *       400:
 *         description: Bad request or invalid file
 *       401:
 *         description: Unauthorized
 */
router.post('/process', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No receipt file uploaded'
      });
    }

    const filePath = req.file.path;
    const filename = req.file.filename;

    // Process the file with OCR
    const ocrResult = await processReceiptOCR(filePath);
    
    // Extract structured data from OCR text
    const extractedData = await extractReceiptData(ocrResult.text);

    // Save OCR history
    const OCRHistory = require('../models/OCRHistory');
    const ocrRecord = new OCRHistory({
      user: req.user.id,
      company: req.user.company,
      filename,
      filePath,
      extractedText: ocrResult.text,
      extractedData,
      confidence: ocrResult.confidence || 0.8
    });

    await ocrRecord.save();

    res.json({
      success: true,
      message: 'Receipt processed successfully',
      data: {
        filename,
        extractedText: ocrResult.text,
        extractedData,
        confidence: ocrResult.confidence || 0.8,
        ocrId: ocrRecord._id
      }
    });

  } catch (error) {
    // Clean up uploaded file if processing fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Error processing receipt',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/ocr/history:
 *   get:
 *     summary: Get OCR processing history
 *     tags: [OCR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: OCR history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const OCRHistory = require('../models/OCRHistory');
    
    const history = await OCRHistory.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await OCRHistory.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      data: history,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching OCR history',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/ocr/{id}:
 *   get:
 *     summary: Get specific OCR result
 *     tags: [OCR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: OCR record ID
 *     responses:
 *       200:
 *         description: OCR result retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: OCR record not found
 */
router.get('/:id', async (req, res) => {
  try {
    const OCRHistory = require('../models/OCRHistory');
    
    const ocrRecord = await OCRHistory.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!ocrRecord) {
      return res.status(404).json({
        success: false,
        message: 'OCR record not found'
      });
    }

    res.json({
      success: true,
      data: ocrRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching OCR record',
      error: error.message
    });
  }
});

// OCR Processing Functions
async function processReceiptOCR(filePath) {
  try {
    // For now, return mock data
    // In production, you would integrate with Tesseract.js or cloud OCR services
    
    const mockText = `
    STARBUCKS COFFEE
    123 Main Street
    Anytown, ST 12345
    
    Date: ${new Date().toLocaleDateString()}
    Time: ${new Date().toLocaleTimeString()}
    
    1x Grande Latte          $5.45
    1x Blueberry Muffin      $2.95
    
    Subtotal:                $8.40
    Tax:                     $0.67
    Total:                   $9.07
    
    Payment: Credit Card
    Thank you for your visit!
    `;

    return {
      text: mockText,
      confidence: 0.92
    };

    // Real implementation would use:
    // const Tesseract = require('tesseract.js');
    // const { data: { text, confidence } } = await Tesseract.recognize(filePath, 'eng');
    // return { text, confidence };

  } catch (error) {
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

async function extractReceiptData(text) {
  try {
    // Extract key information using regex patterns
    const extractedData = {
      merchantName: null,
      amount: null,
      date: null,
      category: 'Other',
      items: []
    };

    // Extract merchant name (first line typically)
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      extractedData.merchantName = lines[0].trim();
    }

    // Extract total amount
    const amountRegex = /(?:total|amount due).*?[\$]?(\d+\.?\d*)/i;
    const amountMatch = text.match(amountRegex);
    if (amountMatch) {
      extractedData.amount = parseFloat(amountMatch[1]);
    }

    // Extract date
    const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      extractedData.date = new Date(dateMatch[1]).toISOString().split('T')[0];
    }

    // Categorize based on merchant name
    if (extractedData.merchantName) {
      extractedData.category = categorizeByMerchant(extractedData.merchantName);
    }

    // Extract line items
    const itemRegex = /(\d+x?\s+.+?\s+\$\d+\.?\d*)/gi;
    const itemMatches = text.match(itemRegex);
    if (itemMatches) {
      extractedData.items = itemMatches.map(item => item.trim());
    }

    return extractedData;

  } catch (error) {
    console.error('Error extracting receipt data:', error);
    return {
      merchantName: null,
      amount: null,
      date: null,
      category: 'Other',
      items: []
    };
  }
}

function categorizeByMerchant(merchantName) {
  const categoryMap = {
    'starbucks': 'Meals & Entertainment',
    'mcdonalds': 'Meals & Entertainment',
    'subway': 'Meals & Entertainment',
    'uber': 'Transportation',
    'lyft': 'Transportation',
    'shell': 'Transportation',
    'exxon': 'Transportation',
    'marriott': 'Lodging',
    'hilton': 'Lodging',
    'best buy': 'Office Supplies',
    'staples': 'Office Supplies',
    'fedex': 'Shipping',
    'ups': 'Shipping'
  };

  const merchant = merchantName.toLowerCase();
  for (const [key, category] of Object.entries(categoryMap)) {
    if (merchant.includes(key)) {
      return category;
    }
  }

  return 'Other';
}

module.exports = router;