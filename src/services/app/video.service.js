const httpStatus = require('http-status');
const { Video, Category } = require('../../models');
const ApiError = require('../../utils/ApiError');
const mongoose = require('mongoose');

const listVideo = async(reqBody)=>{
    const {page=1,limit=10,search,sortBy="createdAt",sortOrder=-1} = reqBody;
    let sortValue={};
    sortValue[sortBy] = sortOrder;
    sortValue["_id"] = sortOrder;
    let filter = {isDeleted:false};
    let pipeline = [
        {
            $match:filter
        },
        {
            $facet: {
              totalRecords: [
                { $count: "total" }
              ],
              results: [
                { $skip: (page - 1) * limit },
                { $limit: limit },
                { $sort: sortValue }
              ],
            },
        },
        {
            $addFields: {
                totalRecords: { $ifNull: [{ $arrayElemAt: ["$totalRecords.total", 0] }, 0] }
            }
        }
    ];

    let video = await Video.aggregate(pipeline);
    video = video[0];
    let totalRecords = video.totalRecords;

    let data = {
        totalRecords:0,
        result:[],
        page:page,
        totalPages:0,
    };
    
    if(totalRecords < 1){
        return data;
    }else{
        data = {
            totalRecords:totalRecords,
            results:video.results,
            page:page,
            totalPages:Math.ceil(totalRecords / limit)
        };
    }

    return data;
}

module.exports = {
    listVideo
}