const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const schema = new Schema({
    userId: {
        type: String,
        ref: 'users'
    },
    form16Url: {
        type: String,
        required: true
    },
    quaterNo:{
        type: Number,
        required: true
    }


}, {
    timestamps: true
});

module.exports = mongoose.model('form16Table', schema);