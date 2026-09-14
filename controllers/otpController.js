const { createOtp } = require('../services/otpService');

function sendOtp(request, response) {
  const email = request.body?.email;

  if (typeof email !== 'string' || email.trim() === '') {
    return response.status(400).json({
      message: 'Email is required.'
    });
  }

  createOtp(email.trim());

  return response.json({
    message: 'OTP request accepted.'
  });
}

module.exports = { sendOtp };