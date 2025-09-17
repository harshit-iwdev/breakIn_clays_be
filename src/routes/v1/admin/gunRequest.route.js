const express = require('express');
const validate = require('../../../middlewares/validate');
const {gunRequestValidation} = require('../../../validations/admin');
const {gunRequestController} = require('../../../controllers/admin');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/',auth(), validate(gunRequestValidation.list), gunRequestController.listGunRequest);
//router.post('/create',auth(), gunRequestController.createGunRequest);
   
router
.route('/')
.patch(auth(), validate(gunRequestValidation.action), gunRequestController.requestAction);

module.exports = router;