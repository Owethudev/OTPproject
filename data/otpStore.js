const otpStore = new Map();

function saveOtp(email, otpInformation) {
  otpStore.set(email, otpInformation);
}

function getOtp(email) {
  return otpStore.get(email);
}

function updateOtp(email, otpInformation) {
  otpStore.set(email, otpInformation);
}

function deleteOtp(email) {
  return otpStore.delete(email);
}

module.exports = {
  saveOtp,
  getOtp,
  updateOtp,
  deleteOtp
};