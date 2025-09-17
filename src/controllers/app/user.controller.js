const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const message = require('../../utils/message');
const { userService } = require('../../services/app');
const { sendUserNotification, testNotification } = require('../../utils/pushNotification');

const saveProfileImage = catchAsync(async (req, res) => {
    await userService.saveProfileImage(req.user._id,req.body.profileImage);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.USER_UPDATED, {});;
});

const getUserProfile = catchAsync(async (req, res) => {
    const user = await userService.getUserProfile(req.user._id);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.USER_FOUND, {result:user});
});

const updateUserById = catchAsync(async (req, res) => {
    const user = await userService.updateUserById(req.user._id,req.body);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.USER_UPDATED, {result:user});
});

const changePassword = catchAsync(async (req, res) => {
    await userService.changePassword(req.user._id,req.body);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.USER_UPDATED, {});
});

const deleteUserProfile = catchAsync(async (req, res) => {
    await userService.deleteUserById(req.user._id);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.USER_DELETED, {});
});

const verifyEmail = catchAsync(async (req, res) => {
    const {email,otp} = req.body;
    const user = await userService.verifyEmail(email,otp);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.USER_UPDATED, {});
});

const listPatch = catchAsync(async (req, res) => {
    const patches = await userService.listPatch(req.body,req.user._id);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.PATCH_FOUND, { ...patches });
  });

const listNotification = catchAsync(async (req, res) => {
    const notification = await userService.listNotification(req.body,req.user._id);
    res.sendJSONResponse(httpStatus.OK, true, "Notification found.", { ...notification });
});

const readNotification = catchAsync(async (req, res) => {
    let notification = await userService.readNotification(req.user._id,req.body.notificationIds);
    res.sendJSONResponse(httpStatus.OK, true, "Notification read successfully.", {result:notification});
});

const deleteNotification = catchAsync(async (req, res) => {
    let notification = await userService.deleteNotification(req.user._id,req.body.notificationIds);
    res.sendJSONResponse(httpStatus.OK, true, "Notification deleted successfully.", {result:notification});
});

const testFirebase = catchAsync(async (req, res) => {
      await testNotification(
          [req.body.token],
          `Test notification! \uD83C\uDFAF`,
          `test notification for Breaking Clay!`,
          {}
      );
      res.sendJSONResponse(httpStatus.OK, true, "notification sent successfully", {});
});

const confirmEmailAndDelete = catchAsync(async (req, res) => {
    const {email,otp} = req.body;
    await userService.confirmEmailAndDelete(email,otp);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.USER_DELETED, {});
});

const metricUpdate = catchAsync(async (req, res) => {
    const user = await userService.metricUpdate(req.user._id);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.USER_UPDATED, {result:{isMetric:user.isMetric}});
});


const premiumUpdate = catchAsync(async (req, res) => {
    await userService.premiumUpdate(req.user._id,req.body.isPremium);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.USER_UPDATED, {});
});

const notifyUpdate = catchAsync(async (req, res) => {
    const user = await userService.notifyUpdate(req.user._id);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.USER_UPDATED, {result:{isNotify:user.isNotify}});
});

module.exports = {
    saveProfileImage,
    getUserProfile,
    updateUserById,
    changePassword,
    deleteUserProfile,
    verifyEmail,
    listPatch,
    testFirebase,
    listNotification,
    readNotification,
    deleteNotification,
    confirmEmailAndDelete,
    metricUpdate,
    premiumUpdate,
    notifyUpdate,
}