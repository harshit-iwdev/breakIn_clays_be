const mongoose = require('mongoose');

const patchSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    patchScore: {
      type: Number,
      required: true,
    },
    patchImage: {
      type: String,
      required: false,
    },
    patchImageName: {
      type: String,
      required: false,
    },
    patchExpiryAt: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * @typedef Patch
 */
const Patch = mongoose.model('Patch', patchSchema);

module.exports = Patch;
