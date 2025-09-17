const express = require("express");
const validate = require("../../../middlewares/validate");
const { scoreValidation } = require("../../../validations/app");
const { scoreController } = require("../../../controllers/app");
const auth = require("../../../middlewares/auth");

const router = express.Router();

router.post(
  "/",
  auth(),
  validate(scoreValidation.list),
  scoreController.listScore
);

router.post(
  "/add",
  auth(),
  validate(scoreValidation.add),
  scoreController.createScore
);
///edit score endpoint
router.put(
  "/edit",
  auth(),
  validate(scoreValidation.edit),
  scoreController.editScore
);

//softdelete score
router.delete("/delete/:scoreId", auth(), scoreController.softDeleteScore);
router.post("/highest", auth(), scoreController.getHighestStreak);
//router.put('/edit',auth(), validate(eventValidation.edit), eventController.editEvent);

router
  .route("/gun")
  .post(auth(), validate(scoreValidation.gunList), scoreController.userGunList);

router.route("/:scoreId").get(auth(), scoreController.getScore);

router.post("/pdf", auth(), scoreController.scorePDF);

//.delete(auth(), validate(eventValidation.deleteEvent), eventController.deleteEvent);

module.exports = router;
