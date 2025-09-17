const mongoose = require('mongoose');

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    rules: {
      type: String,
      required: false,
    },
    handicap: {
      type: Number,
      required: false,
    },
    minRound: {
      type: Number,
      required: false,
    },
    maxRound: {
      type: Number,
      required: false,
    },
    image: {
      type: String,
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

/**
 * @typedef Category
 */
const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
