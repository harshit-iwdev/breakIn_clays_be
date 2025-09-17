const express = require('express');
const validate = require('../../../middlewares/validate');
const {queryValidation} = require('../../../validations/admin');
const {queryController} = require('../../../controllers/admin');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/',auth(), validate(queryValidation.list), queryController.listQuery);
router.get('/',auth(), queryController.getTypes);

router
  .route('/:queryId')
  .delete(auth(), validate(queryValidation.deleteQuery), queryController.deleteQuery);
   
module.exports = router;