const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { adminNotificationService } = require('../../services/admin');
const message = require('../../utils/message');
const { User } = require('../../models');
const { sendUserNotification } = require('../../utils/pushNotification');

const createAdminNotification = catchAsync(async (req, res) => {
  const adminNotification = await adminNotificationService.createAdminNotification(req.body);
  let users = await User.find({isDeleted:false,isNotify:true}).select('userId');
    users.map(user => user.userId);
    await sendUserNotification({
            receiverIds:users,
            title:adminNotification.title,
            message:adminNotification.message,
            saveLog : true,
            additionalData :{
            }
    });
  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.ADMIN_NOTIFICATION_CREATED, { result:adminNotification });
});

const listAdminNotifications = catchAsync(async (req, res) => {
    const adminNotifications = await adminNotificationService.listAdminNotifications(req.body);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.ADMIN_NOTIFICATION_FOUND, { ...adminNotifications });
});

const deleteAdminNotification = catchAsync(async (req, res) => {
    const adminNotification = await adminNotificationService.deleteAdminNotification(req.params.adminNotificationId);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.ADMIN_NOTIFICATION_DELETED,{});
});

module.exports = {
    createAdminNotification,
    listAdminNotifications,
    deleteAdminNotification,
}