const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { gunRequestService } = require('../../services/admin');
const message = require('../../utils/message');
const { sendUserNotification } = require('../../utils/pushNotification');

const listGunRequest = catchAsync(async (req, res) => {
    const requestList = await gunRequestService.listGunRequest(req.body);
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.GUN_REQUEST_FOUND, { ...requestList });
});

const requestAction = catchAsync(async (req, res) => {
    const resObj = await gunRequestService.requestAction(req.body);
    let {statusMessage,gunSafe,user} = resObj;
    if(user.isNotify == true){
        await sendUserNotification({
            receiverIds:[gunSafe.userId],
            title:`Gun Request update !!!`,
            message:statusMessage,
            saveLog : true,
            additionalData :{
                gunId:gunSafe._id.toString()
            }
        });
    }
    res.sendJSONResponse(httpStatus.OK, true, message.sucessfull_message.GUN);
});
module.exports = {
    listGunRequest,
    requestAction,
}