const express = require('express');
const {dashboardController} = require('../../../controllers/admin');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/',auth(), dashboardController.allData);

module.exports = router;