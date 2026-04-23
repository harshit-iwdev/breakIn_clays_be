const Joi = require('joi');
const { objectId } = require('./custom.validation');
const { STATUS } = require('../../config/config');

const create = {
    body: Joi.object().keys({
      name: Joi.string().required(),
      gauge: Joi.string().allow('', null),
      comb: Joi.string().allow('', null),
      barrel: Joi.string().allow('', null),
      actionType: Joi.string().allow('', null),
      rib: Joi.string().allow('', null),
      pullLength: Joi.string().allow('', null),
      chokeType: Joi.string().allow('', null),
      ChokeSize2: Joi.string().allow('', null),
      chokeMaterial: Joi.string().allow('', null),
      ChokeSize: Joi.string().allow('', null),
      brand: Joi.string().required(),
      model: Joi.string().required(),
    }),
  };

  const edit = {
    body: Joi.object().keys({
      gunId: Joi.string().required().custom(objectId),
      name: Joi.string().required(),
      gauge: Joi.string().allow('', null),
      comb: Joi.string().allow('', null),
      barrel: Joi.string().allow('', null),
      actionType: Joi.string().allow('', null),
      rib: Joi.string().allow('', null),
      pullLength: Joi.string().allow('', null),
      chokeType: Joi.string().allow('', null),
      ChokeSize2: Joi.string().allow('', null),
      chokeMaterial: Joi.string().allow('', null),
      ChokeSize: Joi.string().allow('', null),
      brand: Joi.string().required(),
      model: Joi.string().required(),
    }),
  };

const get = {
  params: Joi.object().keys({
    gunId: Joi.string().required().custom(objectId),
  }),
};

const list = {
  body: Joi.object().keys({
    search: Joi.string().allow(''),
    limit: Joi.number(),
    page: Joi.number(),
    status: Joi.string().valid(...STATUS).required().allow(''),
  }),
};

const gunPartList = {
    body: Joi.object().keys({
      search: Joi.string().allow(''),
    }),
  };

  const deleteGun = {
    params: Joi.object().keys({
      gunId: Joi.string().required().custom(objectId),
    }),
  };

module.exports = {
    create,
    get,
    list,
    gunPartList,
    edit,
    deleteGun,
} 
