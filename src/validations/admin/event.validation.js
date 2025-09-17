const Joi = require('joi');
const { objectId } = require('../custom.validation');

const create = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    latitude: Joi.string().pattern(/^-?\d+(\.\d+)?$/).required(), // Ensures it's a valid decimal number
    longitude: Joi.string().pattern(/^-?\d+(\.\d+)?$/).required(),
    startDate: Joi.string().required(),
    endDate: Joi.string().required(),
    location: Joi.string().required(),
    categoryId: Joi.string().required().custom(objectId),
  }),
};

const get = {
  params: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
  }),
};

const list = {
  body: Joi.object().keys({
    search: Joi.string().allow(''),
    limit: Joi.number(),
    page: Joi.number(),
    categoryId: Joi.string().custom(objectId).allow(""),
    sortOrder: Joi.string().allow(1,-1),
    sortBy: Joi.string().allow('name','startDate','location','createdAt'),
  }),
};

const edit = {
  body: Joi.object().keys({
    eventId: Joi.string().required().custom(objectId),
    name: Joi.string().required(),
    startDate: Joi.string().required(),
    endDate: Joi.string().required(),
    location: Joi.string().required(),
    latitude: Joi.string().pattern(/^-?\d+(\.\d+)?$/).required(), // Ensures it's a valid decimal number
    longitude: Joi.string().pattern(/^-?\d+(\.\d+)?$/).required(),
    categoryId: Joi.string().required().custom(objectId),
  }),
};

const deleteEvent = {
    params: Joi.object().keys({
        eventId: Joi.string().required().custom(objectId),
    }),
  };

module.exports = {
    create,
    get,
    edit,
    deleteEvent,
    list,
} 