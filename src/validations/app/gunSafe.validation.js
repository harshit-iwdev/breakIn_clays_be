const Joi = require('joi');
const { objectId } = require('./custom.validation');
const { GUN_PARTS, STATUS } = require('../../config/config');

const create = {
    body: Joi.object().keys({
      name: Joi.string().required(),
      gauge: Joi.string().required(),
      comb: Joi.string().required(),
      barrel: Joi.string().required(),
      actionType: Joi.string().required(),
      rib: Joi.string().required(),
      pullLength: Joi.string().required(),
      chokeType: Joi.string().required(),
      ChokeSize2: Joi.string().allow("",null),
      chokeMaterial: Joi.string().required(),
      ChokeSize: Joi.string().required(),
      brand: Joi.string().required(),
      model: Joi.string().required(),
    }),
  };

  const edit = {
    body: Joi.object().keys({
      gunId: Joi.string().required().custom(objectId),
      name: Joi.string().required(),
      gauge: Joi.string().required(),
      comb: Joi.string().required(),
      barrel: Joi.string().required(),
      actionType: Joi.string().required(),
      rib: Joi.string().required(),
      pullLength: Joi.string().required(),
      chokeType: Joi.string().required(),
      ChokeSize2: Joi.string().allow("",null),
      chokeMaterial: Joi.string().required(),
      ChokeSize: Joi.string().required(),
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