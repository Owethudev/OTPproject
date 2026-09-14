const otpConfig = require('../config/otpConfig');
const { generateOtp } = require('../utils/otpUtils');
const { getOtp, saveOtp, updateOtp } = require('../data/otpStore');
const { sendOtpEmail } = require('./emailService');

function createOtp(email) {
  const currentTime = Date.now();
  const existingOtpInformation = getOtp(email);
  const requestWindowMilliseconds = 60 * 60 * 1000;
  const requestWindowCutoff = currentTime - requestWindowMilliseconds;
  const requestTimestamps = (existingOtpInformation?.requestTimestamps || [])
    .filter((requestTimestamp) => requestTimestamp >= requestWindowCutoff);

  if (requestTimestamps.length >= otpConfig.maxOtpRequestsPerHour) {
    const error = new Error('OTP request limit exceeded.');
    error.code = 'OTP_RATE_LIMIT_EXCEEDED';
    throw error;
  }

  const resendWindowMilliseconds = otpConfig.resendWindowSeconds * 1000;
  const lastSentAt = existingOtpInformation?.lastSentAt || existingOtpInformation?.createdAt;
  const isWithinResendWindow = existingOtpInformation
    && currentTime - lastSentAt <= resendWindowMilliseconds;

  if (isWithinResendWindow) {
    if (existingOtpInformation.resendCount >= otpConfig.maxResendsPerOtp) {
      const error = new Error('OTP resend limit exceeded.');
      error.code = 'OTP_RESEND_LIMIT_EXCEEDED';
      throw error;
    }

    const resentOtpInformation = {
      ...existingOtpInformation,
      expiresAt: currentTime + otpConfig.otpExpirySeconds * 1000,
      lastSentAt: currentTime,
      resendCount: existingOtpInformation.resendCount + 1,
      requestTimestamps: [...requestTimestamps, currentTime]
    };

    saveOtp(email, resentOtpInformation);
    sendOtpEmail(email, resentOtpInformation.otp);

    return resentOtpInformation;
  }

  const createdAt = currentTime;
  const expiresAt = createdAt + otpConfig.otpExpirySeconds * 1000;
  const historyPeriodMilliseconds = otpConfig.otpRecentHistoryHours * 60 * 60 * 1000;
  const historyCutoff = createdAt - historyPeriodMilliseconds;
  const otpHistory = (existingOtpInformation?.otpHistory || [])
    .filter((historyEntry) => historyEntry.createdAt >= historyCutoff);
  let otp;

  do {
    otp = generateOtp();
  } while (otpHistory.some((historyEntry) => historyEntry.otp === otp));

  const otpInformation = {
    otp,
    createdAt,
    lastSentAt: createdAt,
    expiresAt,
    resendCount: 0,
    used: false,
    requestTimestamps: [...requestTimestamps, createdAt],
    otpHistory: [...otpHistory, { otp, createdAt }]
  };

  saveOtp(email, otpInformation);
  sendOtpEmail(email, otpInformation.otp);

  return otpInformation;
}

function verifyOtp(email, suppliedOtp) {
  const otpInformation = getOtp(email);

  if (!otpInformation || otpInformation.used || Date.now() >= otpInformation.expiresAt) {
    return false;
  }

  if (otpInformation.otp !== suppliedOtp) {
    return false;
  }

  updateOtp(email, {
    ...otpInformation,
    used: true
  });

  return true;
}

module.exports = { createOtp, verifyOtp };