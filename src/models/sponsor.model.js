const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const sponsorSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    tagLine: {
      type: String,
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    startDate: {
      type: Date,
      required: false,
    },
    endDate: {
      type: Date,
      required: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Boolean,
      default: false,
    },
    banner: {
      type: String,
      required: false,
    },
    bannerName: {
      type: String,
      required: false,
    },
    bannerExpiryAt: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * @typedef Sponsor
 */
const Sponsor = mongoose.model('Sponsor', sponsorSchema);

module.exports = Sponsor;
