const cloudinary = require('cloudinary').v2;

function isConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function publicIdFromUrl(url) {
  if (!url || !String(url).includes('res.cloudinary.com')) return '';
  const match = String(url).match(/\/upload\/(?:[^/]+\/)*v\d+\/(.+)\.[a-zA-Z0-9]+(?:\?.*)?$/);
  return match ? decodeURIComponent(match[1]) : '';
}

function uploadBuffer(buffer) {
  if (!isConfigured()) {
    return Promise.reject(Object.assign(new Error('Image storage is not configured'), { status: 503 }));
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'fashion-store', resource_type: 'image' },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
}

async function destroyImage(publicId) {
  if (!publicId) return;
  if (!isConfigured()) {
    throw Object.assign(new Error('Image storage is not configured'), { status: 503 });
  }
  await cloudinary.uploader.destroy(publicId);
}

module.exports = { publicIdFromUrl, uploadBuffer, destroyImage };
