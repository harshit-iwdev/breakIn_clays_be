const express = require('express');
const validate = require('../../../middlewares/validate');
const {videoValidation} = require('../../../validations/admin');
const {videoController} = require('../../../controllers/admin');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/',auth(), validate(videoValidation.list), videoController.listVideo);
   
router.post('/create',auth(), validate(videoValidation.create), videoController.createVideo);
router.put('/edit',auth(), validate(videoValidation.edit), videoController.editVideo);

router
  .route('/:videoId')
  .get(auth(), validate(videoValidation.get), videoController.getVideo)
  .delete(auth(), validate(videoValidation.deleteVideo), videoController.deleteVideo);
   
module.exports = router;