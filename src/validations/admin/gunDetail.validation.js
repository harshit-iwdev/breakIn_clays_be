const Joi = require('joi');
const { objectId } = require('../custom.validation');
const { GUN_PARTS,CONDITIONAL_GUN_PART } = require('../../config/config');
const allowedValues = GUN_PARTS;

  const create = {
    body: Joi.object().keys({
      value: Joi.string().required(),
      type: Joi.string().valid(...allowedValues).required(),
      metricValue: Joi.string().when('type', {
        is: Joi.valid(...CONDITIONAL_GUN_PART),
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    }),
  };

  const edit = {
    body: Joi.object().keys({
      gunDetailId: Joi.string().required().custom(objectId),
      value: Joi.string().required(),
      type: Joi.string().valid(...allowedValues).required(),
      metricValue: Joi.string().when('type', {
        is: Joi.valid(...CONDITIONAL_GUN_PART),
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    }),
  };

  const list = {
    body: Joi.object().keys({
      search: Joi.string().allow(''),
      limit: Joi.number(),
      page: Joi.number(),
      type: Joi.string().valid(...allowedValues).required()
    }),
  };

  const get = {
    params: Joi.object().keys({
      gunDetailId: Joi.string().required().custom(objectId),
    }),
  };

  const deleteGunDetail = {
    params: Joi.object().keys({
      gunDetailId: Joi.string().required().custom(objectId),
    }),
  };

module.exports = {
    create,
    list,
    get,
    edit,
    deleteGunDetail,
}