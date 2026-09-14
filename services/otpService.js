const otpConfig = require('../config/otpConfig');
const { generateOtp } = require('../utils/otpUtils');
const { getOtp, saveOtp } = require('../data/otpStore');

function createOtp(email) {
  const createdAt = Date.now();
  const existingOtpInformation = getOtp(email);
  const requestWindowMilliseconds = 60 * 60 * 1000;
  const requestWindowCutoff = createdAt - requestWindowMilliseconds;
  const requestTimestamps = (existingOtpInformation?.requestTimestamps || [])
    .filter((requestTimestamp) => requestTimestamp >= requestWindowCutoff);

  if (requestTimestamps.length >= otpConfig.maxOtpRequestsPerHour) {
    const error = new Error('OTP request limit exceeded.');
    error.code = 'OTP_RATE_LIMIT_EXCEEDED';
    throw error;
  }

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
    expiresAt,
    resendCount: 0,
    used: false,
    requestTimestamps: [...requestTimestamps, createdAt],
    otpHistory: [...otpHistory, { otp, createdAt }]
  };

  saveOtp(email, otpInformation);

  return otpInformation;
}

module.exports = { createOtp };