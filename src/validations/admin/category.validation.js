const Joi = require('joi');
const { objectId } = require('../custom.validation');

const list = {
  body: Joi.object().keys({
    search: Joi.string().allow(''),
    limit: Joi.number(),
    page: Joi.number(),
  }),
};

const get = {
  params: Joi.object().keys({
    categoryId: Joi.string().required().custom(objectId),
  }),
};

module.exports = {
    list,
    get,
} 