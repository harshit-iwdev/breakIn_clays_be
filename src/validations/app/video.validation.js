const Joi = require('joi');

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
    list,
}
