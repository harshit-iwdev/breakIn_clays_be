const Joi = require('joi');
const { objectId } = require('../custom.validation');

const create = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    message: Joi.string().required(),
  }),
};

const list = {
  body: Joi.object().keys({
    search: Joi.string().allow(''),
    limit: Joi.number(),
    page: Joi.number(),
    sortOrder: Joi.string().allow(1,-1),
    sortBy: Joi.string().allow('title','message','createdAt'),
  }),
};

const deleteAdminNotification = {
    params: Joi.object().keys({
        adminNotificationId: Joi.string().required().custom(objectId),
    }),
  };

module.exports = {
    create,
    deleteAdminNotification,
    list,
} 