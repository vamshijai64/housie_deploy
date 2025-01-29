const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  created_by: {
    type: String,
    ref: "admins",
    required: true
  },
  status: {
    type: Number,
    default: 1,
    enum: [0, 1]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('bonus', schema);