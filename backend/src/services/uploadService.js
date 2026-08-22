const path = require('path');

class UploadService {
  static async uploadFile(file) {
    if (!file) throw new Error('No file provided');

    // Default local file path served statically from http://localhost:5000/uploads/...
    // In production we can construct the backend URL using environment variables
    const serverUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const fileUrl = `${serverUrl}/uploads/${file.filename}`;

    return {
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      fileUrl: fileUrl
    };
  }
}

module.exports = UploadService;
