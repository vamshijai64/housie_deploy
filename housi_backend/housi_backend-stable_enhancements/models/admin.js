const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  name: {
    type: String,
  },
  mobile: {
    type: String,
  },
  email: {
    type: String,
     
  },
  password: {
    type: String,
    required: true
  },
  profile_pic: {
    type: String,
  },
  isLoggedIn: {
    type: Boolean,
    required: true,
    default: true
  },
  isBlocked: {
    type: String,
    default: "0"
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  role: {
    type: String,
    enum: ['super admin', 'admin', 'sub admin'],
    default: 'sub admin'
  },
  admin_privileges: {
    type: [String],
    enum: ['quiz', 'subAdmin', 'usersManagement',
      'userWallet', 'bannerManagement',
      'bonusManagement', 'reports', 'withdrawnRequest',
      'notificationManagement', 'deposit-gst', 'tds'],
    default: undefined
  },
},
  {
    timestamps: true
  });

module.exports = mongoose.model('admin', schema);
