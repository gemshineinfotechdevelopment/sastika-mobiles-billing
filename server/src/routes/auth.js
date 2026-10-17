import express from 'express';
import { User } from '../models/User.js';

const router = express.Router();

// GET current logged-in user profile
router.get('/me', async (req, res) => {
  try {
    let user = await User.findOne({ username: 'officetest' }).select('-password');
    if (!user) {
      user = await User.create({
        username: 'officetest',
        password: 'admin$123',
        name: 'Rajesh Kumar',
        role: 'admin',
        shopName: 'Sastika Mobiles',
      });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST change password
router.post('/change-password', async (req, res) => {
  try {
    const { username = 'officetest', newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match',
      });
    }

    if (newPassword.trim().length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 4 characters long',
      });
    }

    const normalizedUsername = username.trim().toLowerCase();
    let user = await User.findOne({ username: normalizedUsername });

    if (!user) {
      user = new User({
        username: normalizedUsername,
        password: newPassword,
        name: 'Rajesh Kumar',
        role: 'admin',
        shopName: 'Sastika Mobiles',
      });
    } else {
      user.password = newPassword;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully in database',
      user: {
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update password',
    });
  }
});

// POST login check
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    const user = await User.findOne({
      username: username.trim().toLowerCase(),
      password: password,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
