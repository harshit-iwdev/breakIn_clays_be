const Joi = require('joi');
const { objectId } = require('../custom.validation');

const create = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    link: Joi.string().required(),
  }),
};

const edit = {
  body: Joi.object().keys({
    videoId: Joi.string().required().custom(objectId),
    title: Joi.string().required(),
    link: Joi.string().required(),
  }),
};

const get = {
  params: Joi.object().keys({
    videoId: Joi.string().required().custom(objectId),
  }),
};
const deleteVideo = {
  params: Joi.object().keys({
    videoId: Joi.string().required().custom(objectId),
  }),
};
const list = {
    body: Joi.object().keys({
      search: Joi.string().allow(''),
      limit: Joi.number(),
      page: Joi.number(),
      sortOrder: Joi.string().allow(1,-1),
      sortBy: Joi.string().allow('title','link','createdAt'),
    }),
};
  
module.exports = {
    create,
    get,
    list,
    edit,
    deleteVideo,
}
