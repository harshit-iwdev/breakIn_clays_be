const mongoose = require('mongoose');
const { STATUS } = require('../config/config');

const gunRequestSchema = mongoose.Schema(
  { 
    requestFields: {
      type: Array,
      required: true,
    },
    gunSafeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GunSafe",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
        type: String,
        enum: STATUS,
        required: false,
        default:"PENDING"
    },
    reason: {
        type: String,
        required: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

/**
 * @typedef GunRequest
 */
const GunRequest = mongoose.model('GunRequest', gunRequestSchema);

module.exports = GunRequest;