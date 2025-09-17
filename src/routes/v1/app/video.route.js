const express = require('express');
const validate = require('../../../middlewares/validate');
const {videoValidation} = require('../../../validations/app');
const {videoController} = require('../../../controllers/app');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/',auth(), validate(videoValidation.list), videoController.listVideo);

module.exports = router;