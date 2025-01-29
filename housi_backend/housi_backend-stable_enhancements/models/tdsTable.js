const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const schema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    amount: {
        type: Number,
        default: 0
    },
    AfterTdsAmount: {
        type: Number,
        default: 0
    },

    type: {
        type: String,
        enum: ['deposit', 'withdraw']
    },
    status: {
        type: Number,
        default: 0
    }
   
}, {
    timestamps: true
});

module.exports = mongoose.model('tdsTable', schema);