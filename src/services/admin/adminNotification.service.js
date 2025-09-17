const { AdminNotification } = require('../../models');
const mongoose = require("mongoose");
const ApiError = require('../../utils/ApiError');
const httpStatus = require('http-status');

const createAdminNotification = async (reqBody) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try{
    const { title,message } = reqBody;
    const adminNotification = await AdminNotification.create([{ title,message }], { session });

    // send notification to user //

    // ---------END------------  //
    
    await session.commitTransaction();
    
    session.endSession();

    return adminNotification[0];

  }catch(error){
    await session.abortTransaction();
    session.endSession();
    if (error instanceof ApiError) {
        throw error;
    }  
    throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to send notification. Please try again later.');
  }
}

const deleteAdminNotification = async(adminNotificationId)=>{
    
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const adminNotification = await AdminNotification.findOne({_id:adminNotificationId,isDeleted:false}).session(session);
  
      if(!adminNotification){
          throw new ApiError(httpStatus.BAD_REQUEST, 'No notification found.');
        }
  
      adminNotification.isDeleted = true;
      await adminNotification.save({ session });

      await session.commitTransaction();
      session.endSession();
  
      return adminNotification;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
  
      throw error;
    }
  }

  const listAdminNotifications = async(reqBody)=>{
    const {page=1,limit=10,search,sortBy="createdAt",sortOrder=-1} = reqBody;
    let sortValue={};
    sortValue[sortBy] = sortOrder;
    sortValue["_id"] = sortOrder;
    let filter = {isDeleted:false};
    if(search){
      filter.$or = [
          { title: { $regex: `.*${search.toLowerCase()}.*`, $options: 'i' } },
          { message: { $regex: `.*${search.toLowerCase()}.*`, $options: 'i' } },
        ];
    }
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
                { $sort: sortValue },
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

    let adminNotification = await AdminNotification.aggregate(pipeline);
    adminNotification = adminNotification[0];
    let totalRecords = adminNotification.totalRecords;
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
            results:adminNotification.results,
            page:page,
            totalPages:Math.ceil(adminNotification.totalRecords / limit)
        };
    }
    return data;
}

module.exports = {
    createAdminNotification,
    deleteAdminNotification,
    listAdminNotifications,
}