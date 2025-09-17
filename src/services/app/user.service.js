const httpStatus = require("http-status");
const {
  User,
  UserCalendar,
  Score,
  Event,
  GunSafe,
  GunRequest,
  Token,
  Patch,
  Notification,
  UserDevice,
} = require("../../models");
const AWSManager = require("../../utils/aws");
const ApiError = require("../../utils/ApiError");
const { createUrl } = require("../../utils/aws");
const message = require("../../utils/message");
const { welcomeMail, deleteMail } = require("../../utils/ses");
const mongoose = require("mongoose");

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  const {
    email,
    password,
    confirmPassword,
    userName,
    profileImage,
    socialToken,
  } = userBody;

  if (!socialToken) {
    if (password !== confirmPassword) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Confirm password does not matched."
      );
    }
  }

  let ifExist = await User.findOne({
    socialToken: { $exists: true, $eq: socialToken },
    isDeleted: false,
  });
  if (ifExist) {
    if (socialToken) {
      ifExist.isEmailVerified = true;
      ifExist.socialToken = socialToken;
      await ifExist.save();
      return ifExist;
    } else {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Already registered with this social account."
      );
    }
  }

  const userCheck = await User.findOne({
    isDeleted: false,
    userName: userName,
    role: "user",
  });

  if (userCheck) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User name already exist. Please select another one."
    );
  }

  if (await User.isEmailTaken(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  const user = await User.create(userBody);

  if (profileImage) {
    let deleteFile = user.profileImageName ? user.profileImageName : "";
    const signedImage = await createUrl(
      profileImage,
      AWSManager.profileFolderPath
    );
    user.profileImage = signedImage;
    user.profileImageName = profileImage;
    if (deleteFile) {
      await AWSManager.deleteObject(deleteFile, AWSManager.profileFolderPath);
    }
  }

  let otp = Math.floor(100000 + Math.random() * 900000);
  user.otp = otp;

  await user.save();

  let dynamicObj = {
    user: user.name,
    otp: otp,
  };

  await welcomeMail(user.email, dynamicObj);

  return user;
};

const getUserById = async (id) => {
  return User.findById(id);
};

const getUserByEmail = async (email) => {
  return User.findOne({ email, isDeleted: false });
};

const getUserBySocialToken = async (socialToken) => {
  return User.findOne({ socialToken, isDeleted: false });
};

const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  const { name, profileImage } = updateBody;
  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      message.error_message.USER_NOT_FOUND
    );
  }
  let isImage = false;
  if (user.profileImage && profileImage == "") {
    isImage = true;
  }
  if (profileImage && profileImage != "") {
    let deleteFile = user.profileImageName ? user.profileImageName : "";
    const signedImage = await createUrl(
      profileImage,
      AWSManager.profileFolderPath
    );
    user.profileImage = signedImage;
    user.profileImageName = profileImage;
    if (deleteFile) {
      await AWSManager.deleteObject(deleteFile, AWSManager.profileFolderPath);
    }
  } else {
    if (isImage) {
      let deleteFile = user.profileImageName ? user.profileImageName : "";
      user.profileImage = "";
      user.profileImageName = "";
      if (deleteFile) {
        await AWSManager.deleteObject(deleteFile, AWSManager.profileFolderPath);
      }
    }
  }

  user.name = name;

  await user.save();

  return user;
};

const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  user.isDeleted = true;

  await user.save();

  await UserCalendar.updateMany(
    { userId: user._id },
    { $set: { isDeleted: true } }
  );

  await Event.updateMany({ userId: user._id }, { $set: { isDeleted: true } });

  await Score.updateMany({ userId: user._id }, { $set: { isDeleted: true } });

  await GunSafe.updateMany({ userId: user._id }, { $set: { isDeleted: true } });

  await GunRequest.updateMany(
    { userId: user._id },
    { $set: { isDeleted: true } }
  );

  await Token.deleteMany({ user: user._id });

  await UserDevice.deleteMany({ userId: user._id });

  return user;
};

const saveProfileImage = async (userId, profileImage) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      message.error_message.USER_NOT_FOUND
    );
  }
  if (profileImage) {
    let deleteFile = user.profileImageName ? user.profileImageName : "";
    const signedImage = await createUrl(
      profileImage,
      AWSManager.profileFolderPath
    );
    user.profileImage = signedImage;
    user.profileImageName = profileImage;
    if (deleteFile) {
      await AWSManager.deleteObject(deleteFile, AWSManager.profileFolderPath);
    }
  }

  await user.save();

  return user;
};

const getUserProfile = async (id) => {
  const user = await User.findById(id).select("-password -__v -role");
  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      message.error_message.USER_NOT_FOUND
    );
  }

  return user;
};

const changePassword = async (userId, reqBody) => {
  const { oldPassword, confirmPassword, newPassword } = reqBody;

  if (newPassword !== confirmPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Confirm password does not matched."
    );
  }

  const user = await getUserById(userId);

  if (!user || !(await user.isPasswordMatch(oldPassword))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password does not matched.");
  }

  user.password = newPassword;

  await user.save();
};

const verifyEmail = async (email, otp) => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      message.error_message.USER_NOT_FOUND
    );
  }

  if (user.otp != otp) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      message.error_message.OTP_MISMATCHED
    );
  }

  if (!user.isEmailVerified) {
    user.isEmailVerified = true;
    user.otp = 0;
    await user.save();
  }

  return user;
};

const resetPassword = async (userId, password) => {
  const user = await getUserById(userId);

  user.password = password;

  await user.save();
};

const listPatch = async (reqBody, userId) => {
  const { page = 1, limit = 10, search, categoryId } = reqBody;

  let filter = { isDeleted: false };
  //userId:new mongoose.Types.ObjectId(userId)
  if (categoryId) {
    filter.categoryId = new mongoose.Types.ObjectId(categoryId);
  }
  if (search) {
    filter.$or = [
      { name: { $regex: `.*${search.toLowerCase()}.*`, $options: "i" } },
    ];
  }
  let pipeline = [
    {
      $match: filter,
    },
    {
      $lookup: {
        from: "userpatches",
        localField: "_id",
        foreignField: "patchId",
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$userId", new mongoose.Types.ObjectId(userId)] },
                ],
              },
              isDeleted: false,
            },
          },
        ],
        as: "userPatches",
      },
    },
    {
      $match: {
        userPatches: { $ne: [] },
      },
    },
    {
      $project: {
        patchImage: 1,
        patchCount: { $size: "$userPatches" },
      },
    },
    {
      $facet: {
        totalRecords: [{ $count: "total" }],
        results: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      },
    },
    {
      $addFields: {
        totalRecords: {
          $ifNull: [{ $arrayElemAt: ["$totalRecords.total", 0] }, 0],
        },
      },
    },
  ];

  let patch = await Patch.aggregate(pipeline);

  patch = patch[0];
  let totalRecords = patch.totalRecords;

  let isNewNotification = await Notification.findOne({
    isDeleted: false,
    receiverId: userId,
    isSeen: false,
  }).countDocuments();

  let data = {
    totalRecords: 0,
    result: [],
    page: page,
    totalPages: 0,
    isNewNotification: isNewNotification ? true : false,
  };

  if (totalRecords < 1) {
    return data;
  } else {
    data = {
      totalRecords: totalRecords,
      results: patch.results,
      page: page,
      totalPages: Math.ceil(totalRecords / limit),
      isNewNotification: isNewNotification ? true : false,
    };
  }

  return data;
};

const listNotification = async (reqBody, userId) => {
  const {
    page = 1,
    limit = 10,
    sortKey = "createdAt",
    sortOrder = -1,
  } = reqBody;

  let sortObject = { isSeen: 1, createdAt: -1, _id: -1 };

  //sortObject[sortKey] = sortOrder;

  let filter = {
    isDeleted: false,
    receiverId: new mongoose.Types.ObjectId(userId),
  };

  let isNewNotification = await Notification.findOne({
    isDeleted: false,
    receiverId: new mongoose.Types.ObjectId(userId),
    isSeen: false,
  }).countDocuments();
  let notificationObj = {
    isNotify: false,
    notifyCount: 0,
  };
  if (isNewNotification > 0) {
    notificationObj = {
      isNotify: true,
      notifyCount: isNewNotification,
    };
  }
  let pipeline = [
    {
      $match: filter,
    },
    { $sort: sortObject },
    {
      $facet: {
        totalRecords: [{ $count: "total" }],
        results: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      },
    },
    {
      $addFields: {
        totalRecords: {
          $ifNull: [{ $arrayElemAt: ["$totalRecords.total", 0] }, 0],
        },
      },
    },
  ];

  let notification = await Notification.aggregate(pipeline);
  notification = notification[0];
  let totalRecords = notification.totalRecords;

  let data = {
    totalRecords: 0,
    result: [],
    notificationObj: notificationObj,
    page: page,
    totalPages: 0,
  };

  if (totalRecords < 1) {
    return data;
  } else {
    data = {
      totalRecords: totalRecords,
      results: notification.results,
      notificationObj: notificationObj,
      page: page,
      totalPages: Math.ceil(totalRecords / limit),
    };
  }

  return data;
};

const readNotification = async (userId, notificationIds) => {
  await Notification.updateMany(
    { receiverId: userId, _id: { $in: notificationIds } },
    { $set: { isSeen: true } }
  );
  let isNewNotification = await Notification.findOne({
    isDeleted: false,
    receiverId: new mongoose.Types.ObjectId(userId),
    isSeen: false,
  }).countDocuments();
  let notificationObj = {
    isNotify: false,
    notifyCount: 0,
  };
  if (isNewNotification > 0) {
    notificationObj = {
      isNotify: true,
      notifyCount: isNewNotification,
    };
  }
  return notificationObj;
};

const deleteNotification = async (userId, notificationIds) => {
  await Notification.updateMany(
    { receiverId: userId, _id: { $in: notificationIds } },
    { $set: { isDeleted: true } }
  );

  let isNewNotification = await Notification.findOne({
    isDeleted: false,
    receiverId: new mongoose.Types.ObjectId(userId),
    isSeen: false,
  }).countDocuments();
  let notificationObj = {
    isNotify: false,
    notifyCount: 0,
  };
  if (isNewNotification > 0) {
    notificationObj = {
      isNotify: true,
      notifyCount: isNewNotification,
    };
  }
  return notificationObj;
};

const sendDeleteUserByOTP = async (userBody) => {
  const { email } = userBody;

  const user = await User.findOne({ email, isDeleted: false });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  let otp = Math.floor(100000 + Math.random() * 900000);
  user.deleteOtp = otp;

  await user.save();

  let dynamicObj = {
    user: user.name,
    otp: otp,
  };

  await deleteMail(user.email, dynamicObj);

  return {};
};

const confirmEmailAndDelete = async (email, otp) => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      message.error_message.USER_NOT_FOUND
    );
  }

  if (user.deleteOtp != otp) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      message.error_message.OTP_MISMATCHED
    );
  }

  user.isDeleted = true;
  user.deleteOtp = 0;
  await user.save();

  return user;
};

const metricUpdate = async (userId) => {
  const user = await getUserById(userId);
  user.isMetric = !user.isMetric;
  user.save();
  return user;
};

const premiumUpdate = async (userId, isPremium) => {
  const user = await getUserById(userId);
  user.isPremium = isPremium;
  await user.save();
  return user;
};

const notifyUpdate = async (userId) => {
  const user = await getUserById(userId);
  user.isNotify = !user.isNotify;
  await user.save();
  return user;
};

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  getUserBySocialToken,
  saveProfileImage,
  getUserProfile,
  changePassword,
  verifyEmail,
  resetPassword,
  listPatch,
  listNotification,
  readNotification,
  deleteNotification,
  sendDeleteUserByOTP,
  confirmEmailAndDelete,
  metricUpdate,
  premiumUpdate,
  notifyUpdate,
};
