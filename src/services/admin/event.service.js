const httpStatus = require("http-status");
const { Event, UserCalendar, Category, Score } = require("../../models");
const ApiError = require("../../utils/ApiError");
const mongoose = require("mongoose");

const getEventById = async (id) => {
  const event = await Event.findOne({
    _id: id,
    isDeleted: false,
    isAdmin: true,
  });
  if (!event) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Event not found.");
  }
  return event;
};

const createEvent = async (eventBody, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      name,
      startDate,
      endDate,
      location,
      categoryId,
      latitude,
      longitude,
    } = eventBody;
    const userId = user._id;

    console.log("payload in create event ", eventBody);

    const [event] = await Event.create(
      [
        {
          name,
          startDate,
          endDate,
          location,
          latitude,
          longitude,
          categoryId,
          userId,
          isAdmin: true,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    session.endSession();

    return event;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Unable to create event. Please try again later."
    );
  }
};

const getEvent = async (eventId) => {
  const event = await getEventById(eventId);
  const category = await Category.findById(event.categoryId);
  let formattedEvent = JSON.parse(JSON.stringify(event));
  formattedEvent.category = category;
  return formattedEvent;
};

const deleteEvent = async (eventId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const event = await Event.findOne({
      _id: eventId,
      isDeleted: false,
      isAdmin: true,
    }).session(session);

    if (!event) {
      await session.abortTransaction();
      session.endSession();
      throw new ApiError(httpStatus.BAD_REQUEST, "No event found.");
    }

    event.isDeleted = true;
    await event.save({ session });

    await UserCalendar.updateMany(
      { eventId },
      { $set: { isDeleted: true } },
      { session }
    );

    await Score.updateMany(
      { eventId },
      { $set: { isDeleted: true } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return event;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    throw error;
  }
};

const editEvent = async (eventBody, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      eventId,
      name,
      startDate,
      endDate,
      location,
      categoryId,
      latitude,
      longitude,
    } = eventBody;
    const userId = user._id;

    const event = await Event.findOne({
      _id: eventId,
      userId,
      isDeleted: false,
      isAdmin: true,
    }).session(session);

    if (!event) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Event not found.");
    }

    if (name) event.name = name;
    if (startDate) event.startDate = startDate;
    if (endDate) event.endDate = endDate;
    if (location) event.location = location;
    if (categoryId) event.categoryId = categoryId;
    if (latitude) event.latitude = latitude;
    if (longitude) event.longitude = longitude;

    await event.save({ session });

    // const updatedUserCalendar = await UserCalendar.updateMany(
    //   { eventId },
    //   { $set: { name, date, location } },
    //   { new: true, session }
    // );

    await session.commitTransaction();
    session.endSession();

    return { event }; //userCalendar: updatedUserCalendar
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Unable to edit event. Please try again later."
    );
  }
};

const listEvents = async (reqBody) => {
  const {
    page = 1,
    limit = 10,
    categoryId,
    search,
    sortBy = "createdAt",
    sortOrder = -1,
  } = reqBody;
  let sortValue = {};

  sortValue[sortBy] = sortOrder;
  sortValue["_id"] = sortOrder;

  let filter = { isAdmin: true, isDeleted: false };

  if (categoryId) {
    filter.categoryId = new mongoose.Types.ObjectId(categoryId);
  }
  if (search) {
    const [month, day, year] = search.split("-");
    const searchDate = new Date(`${year}-${month}-${day}`);

    filter.$or = [
      { name: { $regex: `.*${search.toLowerCase()}.*`, $options: "i" } },
      { location: { $regex: `.*${search.toLowerCase()}.*`, $options: "i" } },
      {
        startDate: {
          $gte: searchDate,
          $lt: new Date(searchDate.getTime() + 86400000), // Adds 1 day to get full-day range
        },
      },
      {
        endDate: {
          $gte: searchDate,
          $lt: new Date(searchDate.getTime() + 86400000),
        },
      },
    ];
  }
  let pipeline = [
    {
      $match: filter,
    },
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $facet: {
        totalRecords: [{ $count: "total" }],
        results: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $sort: sortValue },
        ],
      },
    },
    {
      $addFields: {
        totalRecords: {
          $ifNull: [{ $arrayElemAt: ["$totalRecords.total", 0] }, 0],
        },
      },
    },
  ];

  let event = await Event.aggregate(pipeline);
  event = event[0];
  let totalRecords = event.totalRecords;
  let data = {
    totalRecords: 0,
    result: [],
    page: page,
    totalPages: 0,
  };
  if (totalRecords < 1) {
    return data;
  } else {
    data = {
      totalRecords: totalRecords,
      results: event.results,
      page: page,
      totalPages: Math.ceil(event.totalRecords / limit),
    };
  }
  return data;
};

module.exports = {
  getEventById,
  createEvent,
  getEvent,
  deleteEvent,
  editEvent,
  listEvents,
};
