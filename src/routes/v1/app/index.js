const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const eventRoute = require('./event.route');
const scoreRoute = require('./score.route');
const categoryRoute = require('./category.route');
const gunSafeRoute = require('./gunSafe.route');
const analysisRoute = require('./analysis.route');
const queryRoute = require('./query.route');
const sideMenuRoute = require('./sideMenu.route');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/user',
    route: userRoute,
  },
  {
    path: '/event',
    route: eventRoute,
  },
  {
    path: '/score',
    route: scoreRoute,
  },
  {
    path: '/category',
    route: categoryRoute,
  },
  {
    path: '/gun-safe',
    route: gunSafeRoute,
  },
  {
    path: '/analysis',
    route: analysisRoute,
  },
  {
    path: '/query',
    route: queryRoute,
  },
  {
    path: '/menu',
    route: sideMenuRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
