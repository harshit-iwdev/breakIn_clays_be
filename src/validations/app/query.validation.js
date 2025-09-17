const Joi = require('joi');
const { objectId } = require('../custom.validation');
const { QUERY_TYPE } = require('../../config/config');

const create = {
    body: Joi.object().keys({
      query: Joi.string().required(),
      subject: Joi.string().required(),
      type: Joi.string().required().valid(...QUERY_TYPE),
    }),
  };

module.exports = {
    create,
}