const Joi = require('joi');
const { objectId } = require('../custom.validation');
const { STATUS } = require('../../config/config');
const allowedValues = STATUS;

const list = {
  body: Joi.object().keys({
    search: Joi.string().allow(''),
    limit: Joi.number(),
    page: Joi.number(),
    sortKey: Joi.string(),
    sortOrder: Joi.number().allow(1,-1),
  }),
};

const action = {
  body: Joi.object().keys({
    requestId: Joi.string().required().custom(objectId),
    status:  Joi.string().valid(...allowedValues).required(),
    reason: Joi.when('status', {
      is: 'REJECTED',
      then: Joi.string().required().messages({ 'any.required': 'Reason is required when status is REJECTED' }),
      otherwise: Joi.string().optional().allow(""),
    }),
  }),
};

module.exports = {
    list,
    action,
}