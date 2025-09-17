const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { affiliateService } = require('../../services/admin');
const message = require('../../utils/message');

const getAffiliate = catchAsync(async (req, res) => {
    const affiliate = await affiliateService.getAffiliate();
    res.sendJSONResponse(httpStatus.OK, true, "Affiliate link found.", { result:affiliate });
});

const editAffiliate = catchAsync(async (req, res) => {
    const affiliate = await affiliateService.editAffiliate(req.body);
    res.sendJSONResponse(httpStatus.OK, true,"Affiliate link updated", { result:affiliate });
});

module.exports ={
    getAffiliate,
    editAffiliate,
}