const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

// Configuration
const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'boned-images';

// Create S3 client (uses default credential provider chain by default)
// This supports env vars, shared config/SSO, and instance roles without explicit keys
const s3 = new S3Client({ region });

// Build a public URL for an object (virtual-hosted–style URL)
function buildPublicUrl(bucket, key) {
  if (region === 'us-east-1') {
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Upload image to S3
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} - S3 URL of uploaded image
 */
async function uploadImageToS3(fileBuffer, fileName, mimeType) {
  const fileExtension = (fileName && fileName.includes('.')) ? fileName.split('.').pop() : 'jpg';
  const key = `reviews/${uuidv4()}.${fileExtension}`;

  try {
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: 'public-read', // Make images publicly accessible
    }));
    return buildPublicUrl(bucketName, key);
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload image to S3');
  }
}

/**
 * Delete image from S3
 * @param {string} imageUrl - Full S3 URL of the image
 * @returns {Promise<void>}
 */
async function deleteImageFromS3(imageUrl) {
  try {
    // Extract key from URL (supports virtual-hosted–style URLs)
    const url = new URL(imageUrl);
    // Virtual-hosted URLs: https://<bucket>.s3.<region>.amazonaws.com/<key>
    // Path-style fallback: https://s3.<region>.amazonaws.com/<bucket>/<key>
    let key = url.pathname.replace(/^\//, '');
    // If path-style URL, remove leading bucket segment
    if (key.startsWith(`${bucketName}/`)) {
      key = key.substring(bucketName.length + 1);
    }

    await s3.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    }));
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error('Failed to delete image from S3');
  }
}

/**
 * Upload multiple images to S3
 * @param {Array} files - Array of file objects with buffer, originalname, mimetype
 * @returns {Promise<Array<string>>} - Array of S3 URLs
 */
async function uploadMultipleImages(files) {
  const uploadPromises = files.map(file =>
    uploadImageToS3(file.buffer, file.originalname, file.mimetype)
  );
  return Promise.all(uploadPromises);
}

module.exports = {
  uploadImageToS3,
  deleteImageFromS3,
  uploadMultipleImages,
};
