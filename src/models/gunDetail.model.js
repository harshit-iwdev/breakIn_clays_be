const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { GUN_PARTS } = require('../config/config');

const gunDetailSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum:GUN_PARTS,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    metricValue: {
      type: String,
      required: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
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

gunDetailSchema.plugin(toJSON);
gunDetailSchema.plugin(paginate);

/**
 * @typedef GunDetail
 */
const GunDetail = mongoose.model('GunDetail', gunDetailSchema);

module.exports = GunDetail;