function sendOtpEmail(recipientEmail, otp) {
  console.log(`[Development] OTP ${otp} would be sent to ${recipientEmail}.`);
}

module.exports = { sendOtpEmail };