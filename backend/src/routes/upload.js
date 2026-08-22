const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/multer');
const UploadService = require('../services/uploadService');
const logger = require('../utils/logger');

// POST upload file
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileData = await UploadService.uploadFile(req.file);
    res.json(fileData);
  } catch (error) {
    logger.error('File upload route error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
