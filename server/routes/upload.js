import express from 'express';
import { upload, uploadToCloudinary, cloudinary } from '../config/cloudinary.js';

const router = express.Router();

// POST upload single image to Cloudinary
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const folder = req.body.folder || 'sastika_mobiles/products';
    const uploadResult = await uploadToCloudinary(req.file.buffer, { folder });

    res.status(200).json({
      success: true,
      message: 'Image uploaded to Cloudinary successfully',
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image to Cloudinary',
    });
  }
});

// POST upload multiple images to Cloudinary (up to 5 images)
router.post('/multiple', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({ success: false, message: 'No image files uploaded' });
    }

    const folder = req.body.folder || 'sastika_mobiles/gallery';
    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, { folder })
    );

    const results = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      count: results.length,
      images: results.map((r) => ({
        url: r.secure_url,
        publicId: r.public_id,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload images',
    });
  }
});

// DELETE remove image from Cloudinary by publicId
router.delete('/image', async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ success: false, message: 'publicId is required' });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    res.json({
      success: true,
      message: 'Image removed from Cloudinary',
      result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
