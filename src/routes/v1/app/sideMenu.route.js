const express = require('express');
const validate = require('../../../middlewares/validate');
const {videoValidation} = require('../../../validations/app');
const {videoController,sideMenuController} = require('../../../controllers/app');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/video',auth(), validate(videoValidation.list), videoController.listVideo);
router.get('/affiliate',auth(), sideMenuController.getAffiliate);
router.get('/market',auth(), sideMenuController.getMarket);

module.exports = router;