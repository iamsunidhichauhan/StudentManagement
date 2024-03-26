
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiry: { type: Date, required: true }
});
// otpSchema.index({ expiry: 1 }, { expireAfterSeconds: 1 }); 

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
