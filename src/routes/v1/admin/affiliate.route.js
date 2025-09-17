const express = require('express');
const validate = require('../../../middlewares/validate');
const {affiliateValidation} = require('../../../validations/admin');
const {affiliateController} = require('../../../controllers/admin');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .get(auth(), affiliateController.getAffiliate)
  .post(auth(), validate(affiliateValidation.edit), affiliateController.editAffiliate);

module.exports = router;