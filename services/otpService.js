const otpConfig = require('../config/otpConfig');
const { generateOtp } = require('../utils/otpUtils');
const { getOtp, saveOtp, updateOtp } = require('../data/otpStore');
const { sendOtpEmail } = require('./emailService');

function createOtp(email) {
  // Keep only recent request times so the hourly limit stays accurate.
  const currentTime = Date.now();
  const existingOtpInformation = getOtp(email);
  const requestWindowMilliseconds = 60 * 60 * 1000;
  const requestWindowCutoff = currentTime - requestWindowMilliseconds;
  let previousRequestTimestamps = [];

  if (existingOtpInformation && existingOtpInformation.requestTimestamps) {
    previousRequestTimestamps = existingOtpInformation.requestTimestamps;
  }

  const requestTimestamps = previousRequestTimestamps.filter((requestTimestamp) => {
    return requestTimestamp >= requestWindowCutoff;
  });

  if (requestTimestamps.length >= otpConfig.maxOtpRequestsPerHour) {
    const error = new Error('OTP request limit exceeded.');
    error.code = 'OTP_RATE_LIMIT_EXCEEDED';
    throw error;
  }

  const resendWindowMilliseconds = otpConfig.resendWindowSeconds * 1000;
  let lastSentAt;

  if (existingOtpInformation && existingOtpInformation.lastSentAt) {
    lastSentAt = existingOtpInformation.lastSentAt;
  } else if (existingOtpInformation) {
    lastSentAt = existingOtpInformation.createdAt;
  }

  let isWithinResendWindow = false;

  if (existingOtpInformation && currentTime - lastSentAt <= resendWindowMilliseconds) {
    isWithinResendWindow = true;
  }

  if (isWithinResendWindow) {
    if (existingOtpInformation.resendCount >= otpConfig.maxResendsPerOtp) {
      const error = new Error('OTP resend limit exceeded.');
      error.code = 'OTP_RESEND_LIMIT_EXCEEDED';
      throw error;
    }

    const resentOtpInformation = {
      otp: existingOtpInformation.otp,
      createdAt: existingOtpInformation.createdAt,
      expiresAt: currentTime + otpConfig.otpExpirySeconds * 1000,
      lastSentAt: currentTime,
      resendCount: existingOtpInformation.resendCount + 1,
      used: existingOtpInformation.used,
      requestTimestamps: requestTimestamps.concat(currentTime),
      otpHistory: existingOtpInformation.otpHistory
    };

    saveOtp(email, resentOtpInformation);
    sendOtpEmail(email, resentOtpInformation.otp);

    return resentOtpInformation;
  }

  const createdAt = currentTime;
  const expiresAt = createdAt + otpConfig.otpExpirySeconds * 1000;
  const historyPeriodMilliseconds = otpConfig.otpRecentHistoryHours * 60 * 60 * 1000;
  const historyCutoff = createdAt - historyPeriodMilliseconds;
  let previousOtpHistory = [];

  if (existingOtpInformation && existingOtpInformation.otpHistory) {
    previousOtpHistory = existingOtpInformation.otpHistory;
  }

  const otpHistory = previousOtpHistory.filter((historyEntry) => {
    return historyEntry.createdAt >= historyCutoff;
  });
  let otp;

  do {
    otp = generateOtp();
  } while (otpHistory.some((historyEntry) => {
    return historyEntry.otp === otp;
  }));

  const otpInformation = {
    otp,
    createdAt,
    lastSentAt: createdAt,
    expiresAt,
    resendCount: 0,
    used: false,
    requestTimestamps: requestTimestamps.concat(createdAt),
    otpHistory: otpHistory.concat({ otp, createdAt })
  };

  saveOtp(email, otpInformation);
  sendOtpEmail(email, otpInformation.otp);

  return otpInformation;
}

function verifyOtp(email, suppliedOtp) {
  // Read the one OTP currently stored for this email address.
  const otpInformation = getOtp(email);

  if (!otpInformation) {
    return false;
  }

  if (otpInformation.used) {
    return false;
  }

  if (Date.now() >= otpInformation.expiresAt) {
    return false;
  }

  if (otpInformation.otp !== suppliedOtp) {
    return false;
  }

  // Mark the OTP as used so it cannot be accepted again.
  const usedOtpInformation = {
    otp: otpInformation.otp,
    createdAt: otpInformation.createdAt,
    lastSentAt: otpInformation.lastSentAt,
    expiresAt: otpInformation.expiresAt,
    resendCount: otpInformation.resendCount,
    used: true,
    requestTimestamps: otpInformation.requestTimestamps,
    otpHistory: otpInformation.otpHistory
  };

  updateOtp(email, usedOtpInformation);

  return true;
}

module.exports = { createOtp, verifyOtp };