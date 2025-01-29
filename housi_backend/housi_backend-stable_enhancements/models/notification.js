const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const user = require('./users');

const schema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image_name: {
    type: String,
    required: true
  },


  created_by: {
    type: String,
    ref: "admins",
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  send_status: {
    type: Boolean,
    default: false
  },
  status: {
    type: Number,
    default: 1,
    enum: [0, 1]
  }
},
  {
    timestamps: true
  });

module.exports = mongoose.model('notification', schema);