const express = require('express');
const validate = require('../../../middlewares/validate');
const {queryValidation} = require('../../../validations/app');
const {queryController} = require('../../../controllers/app');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/',auth(), validate(queryValidation.create), queryController.createQuery);

module.exports = router;