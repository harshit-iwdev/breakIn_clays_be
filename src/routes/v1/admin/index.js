const express = require('express');
const authRoute = require('./auth.route');
//const userRoute = require('./user.route');
const eventRoute = require('./event.route');
const categoryRoute = require('./category.route');
const gunDetailRoute = require('./gunDetail.route');
const sponsorRoute = require('./sponsor.route');
const marketPlaceRoute = require('./marketPlace.route');
const queryRoute = require('./query.route');
const affiliateRoute = require('./affiliate.route');
const appUserRoute = require('./appUser.route');
const patchRoute = require('./patch.route');
const dashboardRoute = require('./dashboard.route');
const adminNotificationRoute = require('./adminNotification.route');
const videoRoute = require('./video.route');
const gunRequestRoute = require('./gunRequest.route');
const userRoute = require('./user.route');

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
    path: '/category',
    route: categoryRoute,
  },
  {
    path: '/gun-detail',
    route: gunDetailRoute,
  },
  {
    path: '/sponsor',
    route: sponsorRoute,
  },
  {
    path: '/market-place',
    route: marketPlaceRoute,
  },
  {
    path: '/query',
    route: queryRoute,
  },
  {
    path: '/affiliate',
    route: affiliateRoute,
  },
  {
    path: '/app-user',
    route: appUserRoute,
  },
  {
    path: '/patch',
    route: patchRoute,
  },
  {
    path: '/notification',
    route: adminNotificationRoute,
  },
  {
    path: '/dashboard',
    route: dashboardRoute,
  },
  {
    path: '/video',
    route: videoRoute,
  },
  {
    path: '/gun-request',
    route: gunRequestRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;