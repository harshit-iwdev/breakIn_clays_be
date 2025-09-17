const express = require('express');
const validate = require('../../../middlewares/validate');
const {marketPlaceValidation} = require('../../../validations/admin');
const {marketPlaceController} = require('../../../controllers/admin');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .get(auth(), marketPlaceController.getMarketPlace)
  .post(auth(), validate(marketPlaceValidation.edit), marketPlaceController.editMarketPlace);

module.exports = router;