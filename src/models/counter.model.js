const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({

    queryCounter: {
        type: Number,
        required: true,
        default: 101,
    },
    queryInitial: {
        type: String,
        required: true,
        default: "#QU",
    },
    notificationInitial: {
        type: String,
        required: true,
        default: "#NF",
    },
    notificationCounter: {
        type: Number,
        required: true,
        default: 101,
    },

},
{
  timestamps: true,
}
);

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;