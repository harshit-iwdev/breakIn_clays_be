const mongoose = require('mongoose');

const affiliateSchema = mongoose.Schema(
  {
    link: {
      type: String,
      required: true,
      default: "",
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

const Affiliate = mongoose.model('Affiliate', affiliateSchema);

module.exports = Affiliate;