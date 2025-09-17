// const httpStatus = require('http-status');
// const { Event,UserCalendar } = require('../../models');
// const ApiError = require('../../utils/ApiError');
const mongoose = require('mongoose');
const moment = require("moment"); // Install with `npm install moment`
const { Event, UserCalendar } = require('../models');
const { sendUserNotification } = require('../utils/pushNotification');
const { pipeline } = require('nodemailer/lib/xoauth2');
//const { NOTIFICATION_TIME } = require('../../config/config');

const getDayEvent = async()=>{
    const dayStart = moment().utc().startOf('day').toISOString();
    const dayEnd = moment().utc().endOf('day').toISOString();
    
const pipeline = [
    {
      $match: {
        isDeleted:false,
        alertType:"EVENT_DAY",
        date: {
          $gte: new Date(dayStart),
          $lte: new Date(dayEnd),
        }
      }
    },
    {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "event"
        }
    },
    {
        $unwind: {
          path: '$event',
          preserveNullAndEmptyArrays: true,
        },
    },

    {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [ 
            {
              $match: {
                isDeleted: false,
                isNotify: true,
              }
            }
          ]
        }
    },
    {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: false,
        },
    },
  ];
  
  const result = await UserCalendar.aggregate(pipeline);
  if(result.length > 0){
    // let users = await User.find({isDeleted:false}).select('userId');
    // users.map(user => user.userId);
    for(let resultObj of result){
        let eventName = resultObj.event.name.toUpperCase();
        let eventStart = resultObj.event.startDate.toString();
        await sendUserNotification({
            receiverIds:[resultObj.userId],
            title:`Gear Up for Action! \uD83C\uDFAF`,
            message:`Don't miss out! ${eventName} is here starting ${eventStart}.\uD83C\uDFF9 Time to sharpen your aim!`,
            saveLog : true,
            additionalData :{
                eventId:resultObj.event._id.toString()
            }
        });
    }
  }
}

module.exports = {
    getDayEvent
}