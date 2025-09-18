const express = require("express");
const validate = require("../../../middlewares/validate");
const eventValidation = require("../../../validations/app/event.validation");
const eventController = require("../../../controllers/app/event.controller");
const auth = require("../../../middlewares/auth");

const router = express.Router();

router.post(
  "/",
  auth(),
  validate(eventValidation.list),
  eventController.listEvents
);
router.get("/", auth(), eventController.userCalendarList);
router.patch(
  "/",
  auth(),
  validate(eventValidation.notify),
  eventController.notifyEvent
);
router.post(
  "/add",
  auth(),
  validate(eventValidation.create),
  eventController.createEvent
);
router.put(
  "/",
  auth(),
  validate(eventValidation.edit),
  eventController.editEvent
);

router
  .route("/:eventId")
  .get(auth(), validate(eventValidation.get), eventController.getEvent)
  .delete(
    auth(),
    validate(eventValidation.deleteEvent),
    eventController.deleteEvent
  );

module.exports = router;
