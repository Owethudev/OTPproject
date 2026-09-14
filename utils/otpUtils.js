const { randomInt } = require('node:crypto');
const otpConfig = require('../config/otpConfig');

function generateOtp() {
  const maximumValue = 10 ** otpConfig.otpLength;
  const randomNumber = randomInt(0, maximumValue);

  return randomNumber.toString().padStart(otpConfig.otpLength, '0');
}

module.exports = { generateOtp };