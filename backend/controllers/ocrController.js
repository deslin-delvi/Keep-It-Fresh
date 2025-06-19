const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createWorker } = require('tesseract.js');

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Create the multer upload middleware
const uploadMiddleware = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
}).single('image');

// Separate the middleware from the controller function
exports.upload = uploadMiddleware;

// Process image with OCR
exports.processImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    try {
        // Create a new worker
        const worker = await createWorker('eng');
        
        // Recognize text in the image
        const { data } = await worker.recognize(req.file.path);
        
        // Extract product information
        const extractedInfo = extractInformation(data.text);
        
        // Terminate the worker
        await worker.terminate();
        
        // Return OCR results
        res.status(200).json({
            success: true,
            text: data.text,
            extractedInfo: extractedInfo,
            file: {
                filename: req.file.filename,
                path: req.file.path
            }
        });
    } catch (error) {
        console.error('OCR processing error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing image with OCR',
            error: error.message
        });
    }
};

// Extract product name and expiry date from OCR text
function extractInformation(text) {
    const result = {
        productName: null,
        expiryDate: null
    };
    
    // Look for expiry date patterns
    const expiryPatterns = [
        /best before:?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i,
        /expiry:?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i,
        /use by:?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i,
        /exp:?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i,
        /exp date:?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i,
        /EXP: ?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i
    ];
    
    for (const pattern of expiryPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            // Convert to YYYY-MM-DD for the date input
            const dateParts = match[1].split(/[\/\.\-]/);
            if (dateParts.length === 3) {
                let year = dateParts[2];
                const month = dateParts[1].padStart(2, '0');
                const day = dateParts[0].padStart(2, '0');
                
                // Handle 2-digit years
                if (year.length === 2) {
                    year = '20' + year;
                }
                
                result.expiryDate = `${year}-${month}-${day}`;
                break;
            }
        }
    }
    
    // Try to extract product name
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
        // Assume the first non-empty line might be the product name
        result.productName = lines[0].trim();
    }
    
    return result;
}