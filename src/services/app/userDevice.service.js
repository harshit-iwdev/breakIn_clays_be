const { UserDevice } = require("../../models");

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createDevice = async (header, session = "") => {
	let userDevice;

	const newHeader = {
		userId: header.user_id,
		appEnvironment: header["app-environment"] || header["environment"],
		deviceType: header["device-type"],
		deviceName: header["device-name"]?header["device-name"]:header["device-type"],
		deviceId: header["device-id"],
		deviceToken: header["device-token"],
		osVersion: header["os-version"],
		ipAddress: header["ip-address"] || '192.168.0.11',
	};

	const query = {
		deviceId: newHeader.device_id,
		userId: newHeader.user_id,
		deviceType: newHeader.device_type,
	};

	if (session) {
		userDevice = await UserDevice.findOneAndUpdate(query, newHeader, {
			setDefaultsOnInsert: true,
			runValidators: true,
			new: true,
			upsert: true,
			session,
		});
	} else {
		userDevice = await UserDevice.findOneAndUpdate(query, newHeader, {
			setDefaultsOnInsert: true,
			runValidators: true,
			new: true,
			upsert: true,
		});
	}

	return userDevice;
};

const getAndroidTokken = async (user_id) => {
	var tokkens = [];
	let tokken = await UserDevice.find({
		userId: user_id,
		deviceType: "Android",
	});
	tokken.map((x) => tokkens.push(x.deviceToken));
	return tokkens;
};

const getIosTokken = async (user_id) => {
	var tokkens = [];
	let tokken = await UserDevice.find({ userId: user_id, deviceType: "iPhone" });
	tokken.map((x) => tokkens.push(x.deviceToken));
	return tokkens;
};

const getUserDeviceDetailsByUserId = async ({ userIds, session = null }) => {
	let where = {
	  userId: { $in: userIds },
	  deviceToken:{ $ne: null }
	};

	return UserDevice.find(where);
};

const getUserDevice = async (userId, deviceType, condition = {}) => {
    const objUserDevice = await UserDevice.findOne({
      userId: userId,
      deviceType: deviceType,
      ...condition,
    });
    return objUserDevice;
};

module.exports = {
	createDevice,
	getIosTokken,
	getAndroidTokken,
	getUserDeviceDetailsByUserId,
    getUserDevice,
};