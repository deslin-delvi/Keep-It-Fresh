const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const axios  = require('axios');
require('dotenv').config();

// ── Multer storage setup ──
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const uploadMiddleware = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const valid = /jpeg|jpg|png|gif/;
        if (valid.test(file.mimetype) && valid.test(path.extname(file.originalname).toLowerCase())) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
}).single('image');

exports.upload = uploadMiddleware;

// ── Process image with Google Vision API ──
exports.processImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    try {
        // Read image and convert to base64
        const imageBuffer = fs.readFileSync(req.file.path);
        const base64Image = imageBuffer.toString('base64');

        // Call Google Vision API
        const visionResponse = await axios.post(
            `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_KEY}`,
            {
                requests: [{
                    image: { content: base64Image },
                    features: [
                        { type: 'TEXT_DETECTION',      maxResults: 1 },
                        { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }
                    ]
                }]
            }
        );

        const annotations = visionResponse.data.responses[0];

        // Prefer fullTextAnnotation (better for structured text on labels)
        const detectedText = annotations.fullTextAnnotation?.text
            || annotations.textAnnotations?.[0]?.description
            || '';

        if (!detectedText) {
            return res.status(200).json({
                success: false,
                message: 'No text detected in the image. Please try a clearer photo.',
                extractedInfo: { productName: null, expiryDate: null },
                text: ''
            });
        }

        // Extract product name and expiry date from the detected text
        const extractedInfo = extractInformation(detectedText);

        // Clean up uploaded file after processing
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            success: true,
            text: detectedText,
            extractedInfo,
            confidence: annotations.fullTextAnnotation ? 'high' : 'medium'
        });

    } catch (error) {
        console.error('OCR processing error:', error.response?.data || error.message);

        // Clean up file if it exists
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Error processing image',
            error: error.response?.data?.error?.message || error.message
        });
    }
};

// ── Extract product name and expiry date from Vision text ──
function extractInformation(text) {
    const result = {
        productName: null,
        expiryDate:  null
    };

    // ── Expiry date patterns (expanded for real product labels) ──
    const expiryPatterns = [
        // Keyword + DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
        /(?:best before|expiry|expiry date|exp date|exp|use by|bb|mfg|manufacture)[:\s.]*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/gi,

        // Keyword + Month name + Year  e.g. "BB: MAR 2026" or "Exp: March 26"
        /(?:best before|expiry|exp|use by|bb)[:\s.]*([A-Za-z]{3,9}[\s\-\.]\d{2,4})/gi,

        // Keyword + YYYY-MM-DD (ISO)
        /(?:best before|expiry|exp|use by|bb)[:\s.]*(\d{4}[\/\.\-]\d{1,2}[\/\.\-]\d{1,2})/gi,

        // Standalone date formats (no keyword needed)
        /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/g,    // DD/MM/YYYY
        /\b(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/g,    // YYYY/MM/DD
        /\b([A-Za-z]{3,9}[\s\-]\d{4})\b/g,            // MAR 2026
        /\b(\d{1,2}[\s\-][A-Za-z]{3,9}[\s\-]\d{2,4})\b/g  // 26 MAR 2026
    ];

    const MONTHS = {
        jan: '01', feb: '02', mar: '03', apr: '04',
        may: '05', jun: '06', jul: '07', aug: '08',
        sep: '09', oct: '10', nov: '11', dec: '12',
        january: '01', february: '02', march: '03', april: '04',
        june: '06', july: '07', august: '08', september: '09',
        october: '10', november: '11', december: '12'
    };

    for (const pattern of expiryPatterns) {
        pattern.lastIndex = 0; // reset regex state
        const match = pattern.exec(text);
        if (!match) continue;

        const raw = (match[1] || match[0]).trim();

        // Try to parse into YYYY-MM-DD
        const parsed = parseDate(raw, MONTHS);
        if (parsed) {
            result.expiryDate = parsed;
            break;
        }
    }

    // ── Product name: take the longest meaningful line (not a date/number-heavy line) ──
    const lines = text
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 2 && !/^\d+$/.test(l))           // skip pure numbers
        .filter(l => !/[\d]{4}/.test(l) || /[a-zA-Z]{4,}/.test(l)); // skip date-only lines

    if (lines.length > 0) {
        // Prefer lines with mostly letters (product names) over lines with lots of numbers
        const nameLine = lines.find(l => (l.match(/[a-zA-Z]/g) || []).length > l.length * 0.5)
            || lines[0];
        result.productName = nameLine.replace(/[^a-zA-Z0-9\s\-&]/g, '').trim();
    }

    return result;
}

// ── Parse various date formats into YYYY-MM-DD ──
function parseDate(raw, MONTHS) {
    // DD/MM/YYYY or DD-MM-YYYY
    let m = raw.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})$/);
    if (m) {
        let [, d, mo, y] = m;
        if (y.length === 2) y = '20' + y;
        return `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;
    }

    // YYYY/MM/DD
    m = raw.match(/^(\d{4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})$/);
    if (m) {
        let [, y, mo, d] = m;
        return `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;
    }

    // MAR 2026 or MARCH 2026
    m = raw.match(/^([A-Za-z]{3,9})[\s\-](\d{2,4})$/);
    if (m) {
        const mo = MONTHS[m[1].toLowerCase()];
        let y = m[2];
        if (y.length === 2) y = '20' + y;
        if (mo) return `${y}-${mo}-01`;
    }

    // 26 MAR 2026
    m = raw.match(/^(\d{1,2})[\s\-]([A-Za-z]{3,9})[\s\-](\d{2,4})$/);
    if (m) {
        const mo = MONTHS[m[2].toLowerCase()];
        let y = m[3];
        if (y.length === 2) y = '20' + y;
        if (mo) return `${y}-${mo}-${m[1].padStart(2,'0')}`;
    }

    return null;
}