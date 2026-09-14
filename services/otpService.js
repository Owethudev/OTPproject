const otpConfig = require('../config/otpConfig');
const { generateOtp } = require('../utils/otpUtils');
const { getOtp, saveOtp } = require('../data/otpStore');

function createOtp(email) {
  const createdAt = Date.now();
  const expiresAt = createdAt + otpConfig.otpExpirySeconds * 1000;
  const existingOtpInformation = getOtp(email);
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
    otpHistory: [...otpHistory, { otp, createdAt }]
  };

  saveOtp(email, otpInformation);

  return otpInformation;
}

module.exports = { createOtp };