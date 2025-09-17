const express = require('express');
const validate = require('../../../middlewares/validate');
const {eventValidation} = require('../../../validations/admin');
const {eventController} = require('../../../controllers/admin');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/',auth(), validate(eventValidation.list), eventController.listEvents);
   
router.post('/create',auth(), validate(eventValidation.create), eventController.createEvent);
router.put('/edit',auth(), validate(eventValidation.edit), eventController.editEvent);

router
  .route('/:eventId')
  .get(auth(), validate(eventValidation.get), eventController.getEvent)
  .delete(auth(), validate(eventValidation.deleteEvent), eventController.deleteEvent);
   
module.exports = router;