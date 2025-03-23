const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');
const Token = require('../models/token.model');
const { loginLimiter, validatePassword } = require('../middleware/security');
const csrf = require('csurf');
const passport = require('passport');

// CSRF protection
const csrfProtection = csrf({ cookie: true });

// Generate tokens
const generateTokens = async (userId) => {
  const accessToken = jwt.sign(
    { user: { id: userId } },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = crypto.randomBytes(64).toString('hex');
  await Token.create({
    userId: userId,
    refreshToken: refreshToken
  });

  return { accessToken, refreshToken };
};

// Register with password validation
router.post('/register', validatePassword, async (req, res) => {
  const { username, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({ username, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const { accessToken, refreshToken } = await generateTokens(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({ accessToken });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login with rate limiting
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const { accessToken, refreshToken } = await generateTokens(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ msg: 'Refresh token not found' });
  }

  try {
    const token = await Token.findOne({ refreshToken });
    if (!token) {
      return res.status(401).json({ msg: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(token.userId);
    await token.delete();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const { accessToken, refreshToken } = await generateTokens(req.user.id);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      res.redirect(`${process.env.CLIENT_URL}?token=${accessToken}`);
    } catch (err) {
      console.error(err.message);
      res.redirect('/login');
    }
  }
);

module.exports = router;