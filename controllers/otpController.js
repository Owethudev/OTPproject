const { createOtp, verifyOtp } = require('../services/otpService');

function sendOtp(request, response) {
  const email = request.body?.email;

  if (typeof email !== 'string' || email.trim() === '') {
    return response.status(400).json({
      message: 'Email is required.'
    });
  }

  try {
    createOtp(email.trim());
  } catch (error) {
    if (error.code === 'OTP_RATE_LIMIT_EXCEEDED') {
      return response.status(429).json({
        message: 'Too many OTP requests. Please try again later.'
      });
    }

    if (error.code === 'OTP_RESEND_LIMIT_EXCEEDED') {
      return response.status(429).json({
        message: 'OTP resend limit reached. Please wait before requesting a new OTP.'
      });
    }

    throw error;
  }

  return response.json({
    message: 'OTP request accepted.'
  });
}

function verifyOtpCode(request, response) {
  const email = request.body?.email;
  const otp = request.body?.otp;

  if (typeof email !== 'string' || email.trim() === '' || typeof otp !== 'string' || otp === '') {
    return response.status(400).json({
      message: 'Email and OTP are required.'
    });
  }

  if (!/^\d{6}$/.test(otp)) {
    return response.status(400).json({
      message: 'OTP must be exactly 6 digits.'
    });
  }

  const isVerified = verifyOtp(email.trim(), otp);

  if (!isVerified) {
    return response.status(400).json({
      message: 'Invalid or expired OTP.'
    });
  }

  return response.json({
    message: 'OTP verified successfully.'
  });
}

module.exports = { sendOtp, verifyOtpCode };