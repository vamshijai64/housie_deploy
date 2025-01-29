const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  image_name: {
    type: String,
    required: false
  },
  show_status: {
    type: Boolean,
    "default": false,
  },
  BannerType: {
    type: Number,
   required:false
  },
  created_by: {
    type: String,
    required: true,
    ref: "users"
  },
  status: {
    type: Number,
    "default": 1,
    enum: [0, 1]
  }
},
  {
    timestamps: true
  });

module.exports = mongoose.model('banners', schema);