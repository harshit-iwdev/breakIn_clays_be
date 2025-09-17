const mongoose = require('mongoose');

const marketPlaceSchema = mongoose.Schema(
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

const MarketPlace = mongoose.model('MarketPlace', marketPlaceSchema);

module.exports = MarketPlace;