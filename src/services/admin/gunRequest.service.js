const { GunRequest, GunSafe, GunDetail, User } = require('../../models');
const mongoose = require("mongoose");
const ApiError = require('../../utils/ApiError');
const httpStatus = require('http-status');

const getGunRequestById = async(id)=>{
    const gunRequest = await GunRequest.findOne({_id:id,isDeleted:false});
    if(!gunRequest){
        throw new ApiError(httpStatus.BAD_REQUEST, 'Request not found.');
    }
    return gunRequest;
}

const listGunRequest = async(reqBody)=>{
    const {page=1,limit=10,search,sortKey="createdAt",sortOrder=-1} = reqBody;
    let sortObject = {}; 
    sortObject[sortKey] = sortOrder;
    let filter = {isDeleted:false};

    if(search){
       filter.$or = [
           { name: { $regex: `.*${search.toLowerCase()}.*`, $options: 'i' } },
           { actionType: { $regex: `.*${search.toLowerCase()}.*`, $options: 'i' } },
           { model: { $regex: `.*${search.toLowerCase()}.*`, $options: 'i' } },
           { brand: { $regex: `.*${search.toLowerCase()}.*`, $options: 'i' } },
         ];
    }

    let pipeline = [
        {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user',
            },
        },
        {
            $unwind: {
              path: '$user',
              preserveNullAndEmptyArrays: true,
            },
        },
        {
          $lookup: {
            from: 'gunsaves',
            localField: 'gunSafeId',
            foreignField: '_id',
            as: 'gunSafe',
          },
        },
        {
          $unwind: {
            path: '$gunSafe',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
            $project:{
                _id:1,
                name:"$user.name",
                userName:"$user.userName",
                gunName: "$gunSafe.name",
                actionType: "$gunSafe.actionType",
                brand: "$gunSafe.brand",
                model: "$gunSafe.model",
                requestFields: 1,
                status: 1,
                createdAt:1,
                isDeleted:1,
                reason:1,
            }
        },
        {
            $match:filter
        },
        { $sort: sortObject},
        {
            $facet: {
              totalRecords: [
                { $count: "total" }
              ],
              results: [
                { $skip: (page - 1) * limit },
                { $limit: limit },
              ],
            },
        },
        {
            $addFields: {
                totalRecords: { $ifNull: [{ $arrayElemAt: ["$totalRecords.total", 0] }, 0] }
            }
        }
    ];

    let gunRequest = await GunRequest.aggregate(pipeline);
    gunRequest = gunRequest[0];
    let totalRecords = gunRequest.totalRecords;
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
            results:gunRequest.results,
            page:page,
            totalPages:Math.ceil(totalRecords / limit)
        };
    }

    return data;
}

const requestAction = async (reqBody) => {
    const { requestId, status, reason="" } = reqBody;
    let message = "";
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const request = await GunRequest.findOne({ _id: requestId, isDeleted: false }).session(session);
        if (!request) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Request not found.");
        }

        if (request.status !== "PENDING") {
            throw new ApiError(httpStatus.BAD_REQUEST, "An action had already been taken on the request.");
        }

        const gunSafe = await GunSafe.findOne({ _id: request.gunSafeId, isDeleted: false }).session(session);
        if (!gunSafe) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Gun Safe not found.");
        }

        if (status === "APPROVED") {
           await GunDetail.insertMany(request.requestFields, { session });
        }

        gunSafe.status = status;

        if(reason){
            request.reason = reason;
        }
        if(gunSafe.status == "REJECTED"){
            message = "We regret to inform you that your gun profile has been rejected.";
            if(reason){
                message = `We regret to inform you that your gun profile has been rejected. Reason: ${reason}.`;
            }
        }else{
            message = "Your Gun Profile has been Approved successfully.";
        }
        
        await gunSafe.save({ session });

        request.status = status;
        await request.save({ session });
        let user = await User.findOne({ _id: gunSafe.userId, isDeleted: false }).session(session);
        let data = { statusMessage: message, gunSafe: gunSafe, user: user };
        await session.commitTransaction();
        session.endSession();


        return data;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong.", error);
    }
};

module.exports = {
    listGunRequest,
    getGunRequestById,
    requestAction,
}