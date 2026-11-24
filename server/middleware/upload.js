const multer = require('multer');
const config = require('../utils/config');

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      return callback(Object.assign(new Error('Only JPEG, PNG, WebP, or GIF images are allowed'), { status: 400 }));
    }
    callback(null, true);
  }
});
