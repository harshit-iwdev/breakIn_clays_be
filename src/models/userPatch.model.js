const mongoose = require('mongoose');

const userPatchSchema = mongoose.Schema(
  {
    patchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patch",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Score",
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

/**
 * @typedef UserPatch
 */
const UserPatch = mongoose.model('UserPatch', userPatchSchema);

module.exports = UserPatch;
