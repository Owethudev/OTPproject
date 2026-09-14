const otpConfig = {
  maxOtpRequestsPerHour: 3,
  otpExpirySeconds: 30,
  resendWindowSeconds: 300,
  maxResendsPerOtp: 3,
  otpRecentHistoryHours: 24,
  otpLength: 6
};

module.exports = otpConfig;