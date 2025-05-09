// models/tweet.model.js
const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
  content: { type: String, required: true },
  media: [String],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  retweets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tweet' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tweet', tweetSchema);