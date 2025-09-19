const express = require("express");
const router = express.Router();

const adminRoutes = require("./admin"); //Admin Panel
const appRoutes = require("./app"); //App User
const DocRouter = require("./docs.route");

router.use("/", DocRouter);
router.use("/admin", adminRoutes);
router.use("/app", appRoutes);
module.exports = router;
