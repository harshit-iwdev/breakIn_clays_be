const Joi = require('joi');
const { objectId } = require('../custom.validation');
const { QUERY_TYPE } = require('../../config/config');

const list = {
    body: Joi.object().keys({
      search: Joi.string().allow(''),
      limit: Joi.number(),
      page: Joi.number(),
      sortKey: Joi.string(),
      sortOrder: Joi.number().allow(1,-1),
      type: Joi.string().allow('').valid(...QUERY_TYPE),
    }),
  };
  
  const deleteQuery = {
    params: Joi.object().keys({
        queryId: Joi.string().required().custom(objectId),
    }),
  };

module.exports = {
    list,
    deleteQuery
}