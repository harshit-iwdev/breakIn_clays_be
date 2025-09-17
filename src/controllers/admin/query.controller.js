const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { queryService } = require('../../services/admin');

const listQuery = catchAsync(async (req, res) => {
    const queries = await queryService.listQuery(req.body);
    res.sendJSONResponse(httpStatus.OK, true,"Queries found", { ...queries });
});

const deleteQuery = catchAsync(async (req, res) => {
    const query = await queryService.deleteQuery(req.params.queryId);
    res.sendJSONResponse(httpStatus.OK, true, "Query deleted successfully.");
});

const getTypes = catchAsync(async (req, res) => {
    const types = await queryService.getTypes();
    res.sendJSONResponse(httpStatus.OK, true, "Query type found", { results:types });
});

module.exports = {
    listQuery,
    deleteQuery,
    getTypes,
}