const Joi = require('joi');
const { objectId } = require('../custom.validation');

const list = {
  body: Joi.object().keys({
    search: Joi.string().allow(''),
    limit: Joi.number(),
    page: Joi.number(),
    isHome: Joi.boolean(),
  }),
};

const listSponsor = {
  body: Joi.object().keys({
    search: Joi.string().allow(''),
    limit: Joi.number(),
    page: Joi.number(),
    sortKey: Joi.string(),
    sortOrder: Joi.number().allow(1,-1),
    categoryId: Joi.string().custom(objectId).allow(""),
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
    listSponsor,
} 