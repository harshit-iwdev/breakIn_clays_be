const Joi = require('joi');
const { objectId } = require('../custom.validation');

const create = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    startDate: Joi.string().required(),
    endDate: Joi.string().required(),
    tagLine: Joi.string().required(),
    banner: Joi.string().required(),
    categoryId: Joi.string().required().custom(objectId),
  }),
};

const edit = {
  body: Joi.object().keys({
    sponsorId: Joi.string().required().custom(objectId),
    name: Joi.string().required(),
    startDate: Joi.string().required(),
    endDate: Joi.string().required(),
    tagLine: Joi.string().required(),
    banner: Joi.string().required(),
    categoryId: Joi.string().required().custom(objectId),
  }),
};

const get = {
  params: Joi.object().keys({
    sponsorId: Joi.string().required().custom(objectId),
  }),
};
const deleteSponsor = {
  params: Joi.object().keys({
    sponsorId: Joi.string().required().custom(objectId),
  }),
};
const list = {
    body: Joi.object().keys({
      search: Joi.string().allow(''),
      limit: Joi.number(),
      page: Joi.number(),
      sortKey: Joi.string(),
      sortOrder: Joi.number().allow(1,-1),
      categoryId: Joi.string().custom(objectId).allow(""),
    }),
};
  
module.exports = {
    create,
    get,
    list,
    edit,
    deleteSponsor,
}
