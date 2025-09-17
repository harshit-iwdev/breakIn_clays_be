const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { STATUS } = require('../config/config');

const gunSafeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gauge: {
      type: String,
      required: false,
    },
    comb: {
      type: String,
      required: false,
    },
    barrel: {
      type: String,
      required: false,
    },
    actionType: {
      type: String,
      required: false,
    },
    rib: {
      type: String,
      required: false,
    },
    pullLength: {
      type: String,
      required: false,
    },
    chokeType: {
      type: String,
      required: false,
    },
    ChokeSize2: {
      type: String,
      required: false,
    },
    chokeMaterial: {
      type: String,
      required: false,
    },
    ChokeSize: {
      type: String,
      required: false,
    },
    brand: {
      type: String,
      required: true,
    },
    status: {
        type: String,
        enum: STATUS,
        required: false,
    },
    model: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

gunSafeSchema.plugin(toJSON);
gunSafeSchema.plugin(paginate);

/**
 * @typedef GunSafe
 */
const GunSafe = mongoose.model('GunSafe', gunSafeSchema);

module.exports = GunSafe;