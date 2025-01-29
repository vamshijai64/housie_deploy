const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: {
     type: String,
     required: true
    },
    bannerFile: {
        type:String,
        required: true
    }
},
{
  timestamps: true
});

module.exports = mongoose.model('gameBanners', schema);