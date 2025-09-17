const Joi = require('joi');
const { objectId } = require('./custom.validation');
const { SCORE_EVENT_TYPE } = require('../../config/config');
let validEvent = ["",...SCORE_EVENT_TYPE];
const get = {
  body: Joi.object().keys({
    eventType: Joi.string().valid(...validEvent),
    categoryId: Joi.string().required().custom(objectId),
    gunId: Joi.string().custom(objectId),
    location: Joi.string().allow("",null),
    startDate: Joi.string().required(),
    endDate: Joi.string().required(),
  }),
};

const getGuns = {
  body: Joi.object().keys({
    eventType: Joi.string().valid(...validEvent),
    categoryId: Joi.string().required().custom(objectId),
    startDate: Joi.string().required(),
    endDate: Joi.string().required(),
  }),
};

const getLocations = {
  body: Joi.object().keys({
    eventType: Joi.string().valid(...validEvent),
    categoryId: Joi.string().required().custom(objectId),
    startDate: Joi.string().required(),
    endDate: Joi.string().required(),
  }),
};

module.exports = {
    get,
    getGuns,
    getLocations,
}