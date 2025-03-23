const rateLimit = require('express-rate-limit');
const passwordValidator = require('password-validator');

// Password complexity schema
const passwordSchema = new passwordValidator();
passwordSchema
  .is().min(8)
  .is().max(100)
  .has().uppercase()
  .has().lowercase()
  .has().digits(1)
  .has().symbols(1)
  .has().not().spaces();

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again after 15 minutes'
});

// Password validation middleware
const validatePassword = (req, res, next) => {
  if (!passwordSchema.validate(req.body.password)) {
    return res.status(400).json({
      msg: 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character'
    });
  }
  next();
};

module.exports = { loginLimiter, validatePassword };