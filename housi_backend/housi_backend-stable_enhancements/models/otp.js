const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  mobile: {
    type: String,
  },
  otp: {
    type: String,
  },
  expiresIn: {
    type: String
  },
  token: {
    type: String,
    default:''
  }
},
{
  timestamps: true
});

module.exports = mongoose.model('otp', schema);