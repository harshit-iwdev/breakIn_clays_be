// const ApiError = require('../../utils/ApiError');
const mongoose = require('mongoose');
const moment = require("moment"); // Install with `npm install moment`
const { Event, UserCalendar } = require('../models');
const { sendUserNotification } = require('../utils/pushNotification');
//const { NOTIFICATION_TIME } = require('../../config/config');

const getNextDayEvent = async()=>{
  const nextDayStart = moment().utc().add(1, 'days').startOf('day').toISOString();
  const nextDayEnd = moment().utc().add(1, 'days').endOf('day').toISOString();

const pipeline = [
    {
      $match: {
        isDeleted:false,
        alertType:"DAY_BEFORE",
        date: {
          $gte: new Date(nextDayStart),
          $lte: new Date(nextDayEnd),
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
        await sendUserNotification({
            receiverIds:[resultObj.userId],
            title:`Gear Up for Action! \uD83C\uDFAF`,
            message:`Don't miss out! ${eventName} is here starting tomorrow.\uD83C\uDFF9 Time to sharpen your aim!`,
            saveLog : true,
            additionalData :{
                eventId:resultObj.event._id.toString()
            }
        });
    }
  }
}

module.exports = {
    getNextDayEvent
}