const Joi = require("joi");
const { objectId } = require("./custom.validation");
const {
  NOTIFICATION_TIME,
  RECURRING_EVENT_TYPE,
} = require("../../config/config");

const create = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    latitude: Joi.string()
      .pattern(/^-?\d+(\.\d+)?$/)
      .required(), // Ensures it's a valid decimal number
    longitude: Joi.string()
      .pattern(/^-?\d+(\.\d+)?$/)
      .required(),
    startDate: Joi.string().required(),
    endDate: Joi.string().required(),
    location: Joi.string().required(),
    categoryId: Joi.string().required().custom(objectId),
    alertType: Joi.string().valid(...NOTIFICATION_TIME),
    isAutoDelete: Joi.boolean().default(false),
    recurringType: Joi.string().valid(...RECURRING_EVENT_TYPE),
  }),
};

const get = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
  }),
};

const list = {
  body: Joi.object().keys({
    search: Joi.string().allow(""),
    limit: Joi.number(),
    page: Joi.number(),
    page: Joi.number(),
    isAdmin: Joi.boolean(),
  }),
};

const edit = {
  body: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
    name: Joi.string().required(),
    latitude: Joi.string()
      .pattern(/^-?\d+(\.\d+)?$/)
      .required(), // Ensures it's a valid decimal number
    longitude: Joi.string()
      .pattern(/^-?\d+(\.\d+)?$/)
      .required(),
    startDate: Joi.string().required(),
    endDate: Joi.string().required(),
    location: Joi.string().required(),
    categoryId: Joi.string().required().custom(objectId),
    alertType: Joi.string().valid(...NOTIFICATION_TIME),
  }),
};

const deleteEvent = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
  }),
};

const notify = {
  body: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
    alertType: Joi.string().valid(...NOTIFICATION_TIME, ""),
  }),
};

module.exports = {
  create,
  get,
  edit,
  deleteEvent,
  list,
  notify,
};
