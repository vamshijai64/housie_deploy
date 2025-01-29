const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  userId: {
    type: Object,
  },
  email: {
    type: String,
  },
  expiresIn: {
    type: String
  },
  token: {
    type: String
  }
},
{
  timestamps: true
});

module.exports = mongoose.model('accessToken', schema);