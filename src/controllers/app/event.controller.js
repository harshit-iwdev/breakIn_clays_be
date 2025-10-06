const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const { eventService } = require("../../services/app");
const message = require("../../utils/message");

const createEvent = catchAsync(async (req, res) => {
  const event = await eventService.createEvent(req.body, req.user);
  res.sendJSONResponse(
    httpStatus.OK,
    true,
    message.sucessfull_message.EVENT_CREATED,
    { result: event }
  );
});

const getEvent = catchAsync(async (req, res) => {
  const event = await eventService.getEvent(req.params.eventId);
  const dates = eventService.getDatesBetweenWithRecurring(event);
  res.sendJSONResponse(
    httpStatus.OK,
    true,
    message.sucessfull_message.EVENT_FOUND,
    { result: event, availableDates: dates }
  );
});

const editEvent = catchAsync(async (req, res) => {
  const event = await eventService.editEvent(req.body, req.user);
  res.sendJSONResponse(
    httpStatus.OK,
    true,
    message.sucessfull_message.EVENT_UPDATED,
    { result: event }
  );
});

const listEvents = catchAsync(async (req, res) => {
  const events = await eventService.listEvents(req.body, req.user._id);
  res.sendJSONResponse(
    httpStatus.OK,
    true,
    message.sucessfull_message.EVENT_FOUND,
    { ...events }
  );
});

const deleteEvent = catchAsync(async (req, res) => {
  await eventService.deleteEvent(req.params.eventId, req.user._id);
  res.sendJSONResponse(
    httpStatus.OK,
    true,
    message.sucessfull_message.EVENT_DELETED
  );
});

const userCalendarList = catchAsync(async (req, res) => {
  const event = await eventService.userCalendarList(req.user._id);
  res.sendJSONResponse(
    httpStatus.OK,
    true,
    message.sucessfull_message.EVENT_FOUND,
    { result: event }
  );
});

const notifyEvent = catchAsync(async (req, res) => {
  await eventService.notifyEvent(req.body, req.user);
  res.sendJSONResponse(
    httpStatus.OK,
    true,
    message.sucessfull_message.EVENT_UPDATED,
    {}
  );
});

module.exports = {
  createEvent,
  getEvent,
  editEvent,
  listEvents,
  deleteEvent,
  userCalendarList,
  notifyEvent,
};
