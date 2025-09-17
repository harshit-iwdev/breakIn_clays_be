const Joi = require('joi');
const { objectId } = require('../custom.validation');

const list = {
    body: Joi.object().keys({
      search: Joi.string().allow(''),
      userType: Joi.string().allow(''),
      sortOrder: Joi.string().allow(1,-1),
      sortBy: Joi.string().allow('name','userName','email','createdAt'),
      limit: Joi.number(),
      page: Joi.number(),
    }),
  };

const getPatches = {
  params: Joi.object().keys({
    userId: Joi.string().required().custom(objectId),
  }),
};

const userEvents = {
  body: Joi.object().keys({
    userId: Joi.string().required().custom(objectId),
    categoryId: Joi.string().custom(objectId).allow(""),
    limit: Joi.number(),
    page: Joi.number(),
  }),
};
  

module.exports = {
    list,
    getPatches,
    userEvents,
}