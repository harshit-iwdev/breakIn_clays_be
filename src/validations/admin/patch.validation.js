const Joi = require('joi');
const { objectId } = require('../custom.validation');

const create = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    patchImage: Joi.string().required(),
    patchScore: Joi.number().required(),
    categoryId: Joi.string().required().custom(objectId),
  }),
};

const edit = {
  body: Joi.object().keys({
    patchId: Joi.string().required().custom(objectId),
    name: Joi.string().required(),
    patchImage: Joi.string().required(),
    patchScore: Joi.number().required(),
    categoryId: Joi.string().required().custom(objectId),
  }),
};

const get = {
  params: Joi.object().keys({
    patchId: Joi.string().required().custom(objectId),
  }),
};
const deletePatch = {
  params: Joi.object().keys({
    patchId: Joi.string().required().custom(objectId),
  }),
};

const list = {
    body: Joi.object().keys({
      search: Joi.string().allow(''),
      limit: Joi.number(),
      page: Joi.number(),
      categoryId: Joi.string().custom(objectId),
    }),
};
  
module.exports = {
    create,
    get,
    list,
    edit,
    deletePatch,
}
