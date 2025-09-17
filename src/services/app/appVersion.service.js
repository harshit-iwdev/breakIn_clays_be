const {AppVersion} = require("../../models");
/**
 * Check App Version (Force Update)
 * @param {Object}
 * @returns {Object<result>}
 */
// const checkAppVersion = async (deviceType,appVersion) => {
//   let data = {};
//   let where = {
//     deviceType,
//   };
//   const objAppVersion = await AppVersion.findOne(where);

//   if (objAppVersion) {
//     let requiredVersion = objAppVersion.requiredVersion;

//     if (+requiredVersion > +appVersion) {
//       data['mandatory'] = objAppVersion.mandatory;
//       data['updateRequired'] = objAppVersion.updateRequired;
//     } else if (+requiredVersion <= +appVersion) {
//       data['mandatory'] = false;
//       data['updateRequired'] = false;
//     } else {
//       data['mandatory'] = false;
//       data['updateRequired'] = false;
//     }

//     data['updateMessage'] = objAppVersion.message;
//     data['appUrl'] = objAppVersion.appUrl;
//   }

//   return data;
// };

const checkAppVersion = async (deviceType, appVersion) => {
  const data = {};
  const objAppVersion = await AppVersion.findOne({ deviceType });

  // Convert "1.0.4" → "1.4"
  const formatVersion = (version) => {
    const parts = version.split('.');
    return `${parts[0] || 0}.${parts[2] || 0}`;
  };

  if (objAppVersion) {
    const formattedAppVersion = formatVersion(appVersion);
    const requiredVerNum = parseFloat(objAppVersion.requiredVersion);
    const appVerNum = parseFloat(formattedAppVersion);

    if (requiredVerNum > appVerNum) {
      data.mandatory = objAppVersion.mandatory;
      data.updateRequired = objAppVersion.updateRequired;
    } else {
      data.mandatory = false;
      data.updateRequired = false;
    }

    data.updateMessage = objAppVersion.message;
    data.appUrl = objAppVersion.appUrl;
  }

  return data;
};


module.exports = {
  checkAppVersion,
};