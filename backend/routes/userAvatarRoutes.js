const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { uploadFile, deleteFile } = require('../utils/cloudinary');

const prisma = new PrismaClient();

// Configure multer for memory storage (no local files)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF files are allowed.'));
    }
  }
});

// Upload avatar
router.post('/upload', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the user's current avatar
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { image: true }
    });

    // Delete old avatar from Cloudinary if it exists
    if (user?.image) {
      try {
        await deleteFile(user.image);
      } catch (error) {
        console.error('Error deleting old avatar:', error);
      }
    }

    // Convert buffer to base64 for Cloudinary
    const fileBuffer = req.file.buffer;
    const base64File = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await uploadFile(base64File, {
      folder: 'avatars',
      resource_type: 'auto'
    });

    if (!result || !result.secure_url) {
      throw new Error('Failed to upload file to Cloudinary');
    }

    // Update user's avatar in database with Cloudinary public_id
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        image: result.public_id
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true
      }
    });

    // Return the user data with the Cloudinary URL
    res.json({
      ...updatedUser,
      image: result.secure_url
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Error uploading avatar' });
  }
});

// Delete avatar
router.delete('/', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { image: true }
    });

    if (user?.image) {
      // Delete from Cloudinary
      await deleteFile(user.image);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        image: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Avatar delete error:', error);
    res.status(500).json({ error: 'Error deleting avatar' });
  }
});

// Get user avatar
router.get('/:userId', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: { image: true }
    });

    if (!user?.image) {
      return res.status(404).json({ error: 'Avatar not found' });
    }

    // Return the Cloudinary URL
    const imageUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${user.image}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error('Avatar fetch error:', error);
    res.status(500).json({ error: 'Error fetching avatar' });
  }
});

module.exports = router; 
module.exports = router; 