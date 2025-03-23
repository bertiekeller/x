// routes/tweet.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Tweet = require('../models/tweet.model');
const User = require('../models/user.model');

// Post a new tweet
router.post('/', authMiddleware, async (req, res) => {
  const { content, media } = req.body;

  try {
    const newTweet = new Tweet({
      content,
      media,
      userId: req.user.id
    });

    await newTweet.save();
    res.json(newTweet);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all tweets
router.get('/', async (req, res) => {
  try {
    const tweets = await Tweet.find().sort({ createdAt: -1 }).populate('userId', ['username', 'profilePicture']);
    res.json(tweets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get a tweet by ID
router.get('/:id', async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.id).populate('userId', ['username', 'profilePicture']);
    if (!tweet) return res.status(404).json({ msg: 'Tweet not found' });
    res.json(tweet);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete a tweet
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.id);
    if (!tweet) return res.status(404).json({ msg: 'Tweet not found' });

    // Check user
    if (tweet.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await tweet.remove();
    res.json({ msg: 'Tweet removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Like a tweet
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    // Check if the tweet has already been liked by this user
    if (tweet.likes.some(like => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Tweet already liked' });
    }

    tweet.likes.unshift({ user: req.user.id });

    await tweet.save();
    res.json(tweet.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Retweet a tweet
router.post('/:id/retweet', authMiddleware, async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    // Check if the tweet has already been retweeted by this user
    if (tweet.retweets.some(retweet => retweet.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Tweet already retweeted' });
    }

    const newRetweet = new Tweet({
      content: tweet.content,
      media: tweet.media,
      userId: req.user.id,
      retweets: [{ user: tweet.userId }]
    });

    await newRetweet.save();
    res.json(newRetweet);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Search tweets by content
router.get('/search', async (req, res) => {
  const { query } = req.query;

  try {
    const tweets = await Tweet.find({ content: new RegExp(query, 'i') }).populate('userId', ['username', 'profilePicture']);
    res.json(tweets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;