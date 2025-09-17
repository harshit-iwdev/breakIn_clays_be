const httpStatus = require('http-status');
const { User, UserPatch, Event, Score } = require('../../models');
const mongoose = require('mongoose');
const { create } = require('handlebars');

const listAppUser = async(reqBody)=>{
    
    const {page=1,limit=10,search="",userType="",sortBy="createdAt",sortOrder=-1} = reqBody;
    let sortValue={};
    let filter = {isDeleted:false,role:"user"};
    sortValue[sortBy] = sortOrder;
    sortValue["_id"] = sortOrder;
    if(userType && userType=="PREMIUM"){
        filter.isPremium = true;
    }else if(userType && userType=="BASIC"){
        filter.isPremium = false;
    }

    if(search){
        filter.$or = [
            { name: { $regex: `.*${search.toLowerCase()}.*`, $options: 'i' } },
            { userName: { $regex: `.*${search.toLowerCase()}.*`, $options: 'i' } },
            { email: { $regex: `.*${search.toLowerCase()}.*`, $options: 'i' } },
          ];
    }

    let pipeline = [
        {
            $match:filter
        },
        {
            $lookup: {
              from: 'events',
              localField: '_id',
              foreignField: 'userId',
              as: 'events',
            },
        },
        {
            $addFields: {
                totalEvents: { $size: { $ifNull: ["$events", []] } }
            }
        },
        {
            $project:{
                "_id": 1,
                "name":1,
                "userName": 1,
                "email": 1,
                "role": 1,
                "isPremium": 1,
                "profileImage": 1,
                "profileImageName": 1,
                "totalEvents":1
            }
        },
        {
            $facet: {
              totalRecords: [
                { $count: "total" }
              ],
              results: [
                { $skip: (page - 1) * limit },
                { $limit: limit },
                { $sort: sortValue}
              ],
            },
        },
        {
            $addFields: {
                totalRecords: { $ifNull: [{ $arrayElemAt: ["$totalRecords.total", 0] }, 0] }
            }
        }
    ];

    let query = await User.aggregate(pipeline);
    query = query[0];
    let totalRecords = query.totalRecords;

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
            results:query.results,
            page:page,
            totalPages:Math.ceil(totalRecords / limit)
        };
    }

    return data;
}

const listUserPatch = async(userId)=>{

    let filter = {userId:new mongoose.Types.ObjectId(userId),isDeleted:false};

    let pipeline = [
        {
            $match:filter
        },
        {
          $lookup: {
            from: 'patches',
            localField: 'patchId',
            foreignField: '_id',
            as: 'patchDetail',
          },
        },
        {
          $unwind: {
            path: '$patchDetail',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$patchId",
            patchCount: { $sum: 1 },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
            userId: { $first: "$userId" },
            patchId: { $first: "$patchId" },
            scoreId: { $first: "$scoreId" },
            isDeleted: { $first: "$isDeleted" },
            patchDetail: { $first: "$patchDetail" },
          }
        },
        {
          $sort: {createdAt: -1}
        }
    ];

    let patch = await UserPatch.aggregate(pipeline);

    data = {
        results:patch
    };

    return data;
}

const listUserEvents = async(reqBody)=>{
    const {page=1,limit=10,userId,categoryId} = reqBody;
    let user = await User.findById(userId).select('_id name userName email isPremium profileImage');
    let filter = {userId:new mongoose.Types.ObjectId(userId),isDeleted:false};
    
    if(categoryId){
      filter.categoryId = new mongoose.Types.ObjectId(categoryId)
    }

    let pipeline = [
        {
            $match:filter
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        {
          $unwind: {
            path: '$category',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'events',
            localField: 'eventId',
            foreignField: '_id',
            as: 'event',
          },
        },
        {
          $unwind: {
            path: '$event',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
            "$addFields": {
              "event": { "$ifNull": ["$event", {}] }
            }
        },
        { $sort: {createdAt: -1}},
        {
            $facet: {
              totalRecords: [
                { $count: "total" }
              ],
              results: [
                { $skip: (page - 1) * limit },
                { $limit: limit },
                {
                    $project:{
                        "location":1,
                        "totalShots": 1,
                        "totalScore": 1,
                        "category": {
                            "_id": "$category._id",
                            "name": "$category.name",
                        },
                        "event": 1,
                    }
                }
              ],
            },
          },
          {
              $addFields: {
                  totalRecords: { $ifNull: [{ $arrayElemAt: ["$totalRecords.total", 0] }, 0] }
              }
          }
    ];

    let event = await Score.aggregate(pipeline);
    event = event[0];
    let totalRecords = event.totalRecords;
    let data = {
        totalRecords:0,
        results:[],
        page:page,
        totalPages:0,
    };
    if(totalRecords < 1){ 
      return {event:data,user:user};
    }else{
        data = {
            totalRecords:totalRecords,
            results:event.results,
            page:page,
            totalPages:Math.ceil(event.totalRecords / limit)
        };
    }

    return {event:data,user:user};
}

module.exports = {
    listAppUser,
    listUserPatch,
    listUserEvents,
}