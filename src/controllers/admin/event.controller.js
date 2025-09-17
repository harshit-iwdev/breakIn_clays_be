const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { eventService } = require('../../services/admin');
const message = require('../../utils/message');
const { User } = require('../../models');
const { sendUserNotification } = require('../../utils/pushNotification');

const createEvent = catchAsync(async (req, res) => {
  const event = await eventService.createEvent(req.body,req.user);

  let users = await User.find({isDeleted:false,isNotify:true}).select('userId');
    users.map(user => user.userId);
  let eventName = event.name.toUpperCase();
        await sendUserNotification({
            receiverIds:users,
            title:`Gear Up for Action! \uD83C\uDFAF`,
            message:`Don't miss out! ${eventName} is here.\uD83C\uDFF9 Time to sharpen your aim!`,
            saveLog : true,
            additionalData :{
                eventId:event._id.toString()
            }
        });

  res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.EVENT_CREATED, { result:event });
});

const getEvent = catchAsync(async (req, res) => {
    const event = await eventService.getEvent(req.params.eventId);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.EVENT_FOUND, { result:event });
});

const editEvent = catchAsync(async (req, res) => {
    const event = await eventService.editEvent(req.body,req.user);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.EVENT_UPDATED, { result:event });
});

const listEvents = catchAsync(async (req, res) => {
    const events = await eventService.listEvents(req.body,req.user._id);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.EVENT_FOUND, { ...events });
});

const deleteEvent = catchAsync(async (req, res) => {
    const event = await eventService.deleteEvent(req.params.eventId);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.EVENT_DELETED);
});

module.exports = {
    createEvent,
    getEvent,
    editEvent,
    listEvents,
    deleteEvent,
}