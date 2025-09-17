const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin.json');
const mongoose = require('mongoose');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const { Notification } = require('../models');

const userDeviceService  = require('../services/app/userDevice.service');

const sendUserNotification = async ({
  senderId = null,
  receiverIds,
  title,
  message,
  saveLog = false,
  senderSource = 'admin',
  additionalData = {},
}) => {
  let getUserDeviceDetails = await userDeviceService.getUserDeviceDetailsByUserId({
    userIds: receiverIds,
  }); 

  if (getUserDeviceDetails.length) {
   // filter user devices which has device token
   getUserDeviceDetails = getUserDeviceDetails.filter((rowDevice) => rowDevice.deviceToken);
    //if user device details length then send notification else no need to send notification
    if (getUserDeviceDetails.length) {
     for (let { deviceToken: token,userId } of getUserDeviceDetails) {
        let badge = await Notification.findOne({isDeleted:false,receiverId:new mongoose.Types.ObjectId(userId),"isSeen":false}).countDocuments();
        if (badge > 0) {
          badge = badge+1;
        }else{
          badge = 1;
        }
        let tokenIdArr = [token];//["fwKCgR5dRheiWzbfj-P28b:APA91bGuGgQwqSOVgvuAAcwbqktxZrdJ6-2Yaeoy2jxUvFFayFZ7X5TLyKkUhLq9879WHcZ4jW-iLKFYjfU9DQv9dOvZmZaV4og5lCIXwnjN9zvs51b83Ks"];
        _sendPushNotification({ tokenIdArr, title, message,badge, additionalData });
      }
    }

    if (saveLog) {
      const loggedUsers = new Set();
      for (let getUserDeviceDetail of getUserDeviceDetails) {

        const userIdStr = getUserDeviceDetail.userId.toString();
        if (!loggedUsers.has(userIdStr)) {
          _saveLogData({
            title,
            message,
            notifyType:"Developement",
            senderId,
            receiverId: getUserDeviceDetail.userId,
            additionalData,
            senderSource,
          });

          loggedUsers.add(userIdStr);
        }
      }
    }

  }

};

const _sendPushNotification = async ({ tokenIdArr, title, message,badge=0, additionalData = {} }) => {
  // Notification payload
  const messageData = {
    notification: {
      title: title,
      body: message,
    },
    data: {
      ...additionalData, // Add any custom data
      title: title,
      body: message,
    },
    android: {
      priority: "high",
      notification: {
        sound: "default",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: badge,
        },
      },
    },
  };
  console.log("🚀 ~ const_sendPushNotification= ~ messageData:", JSON.messageData)

  try {
    let response;
    if (tokenIdArr.length === 1) {
      // Send to a single device
      response = await admin.messaging().send({
        ...messageData,
        token: tokenIdArr[0],
      });
    } else {
      // Send to multiple devices
      response = await admin.messaging().sendMulticast({
        ...messageData,
        tokens: tokenIdArr,
      });
    }

    console.log("✅ Notification sent successfully:", response);
    //return response;
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    //throw error;
  }
};

const testNotification = async (tokenIdArr, title, message, additionalData)=>{
  await _sendPushNotification({ tokenIdArr, title, message, additionalData});
}

const _saveLogData = ({ title, message, notifyType, senderId, receiverId, additionalData, senderSource }) => {

    let saveObject = {
      senderSource,
      senderId: senderId,
      receiverId: receiverId,
      title: title,
      message: message,
      notifyType: notifyType,
      additionalData: additionalData,
    }

    new Notification(saveObject).save();
};

module.exports = {
  sendUserNotification,
  testNotification
}