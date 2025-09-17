const express = require('express');
const validate = require('../../../middlewares/validate');
const {adminNotificationValidation} = require('../../../validations/admin');
const {adminNotificationController} = require('../../../controllers/admin');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/',auth(), validate(adminNotificationValidation.list), adminNotificationController.listAdminNotifications);
   
router.post('/create',auth(), validate(adminNotificationValidation.create), adminNotificationController.createAdminNotification);

router
  .route('/:adminNotificationId')
  .delete(auth(), validate(adminNotificationValidation.deleteAdminNotification), adminNotificationController.deleteAdminNotification);
   
module.exports = router;