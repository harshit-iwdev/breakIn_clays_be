const httpStatus = require("http-status");
const { Event, UserCalendar, Score } = require("../../models");
const ApiError = require("../../utils/ApiError");
const mongoose = require("mongoose");
const moment = require("moment"); // Install with `npm install moment`
const {
  NOTIFICATION_TIME,
  RECURRING_EVENT_TYPE,
} = require("../../config/config");
const { normalizeDateString } = require("../../utils/dateUtils");

async function getNotificationTime(eventDate, selectedOption) {
  const timeMapping = {
    "A Day Before": { days: 1 },
    "12 Hours Before": { hours: 12 },
    "06 Hours Before": { hours: 6 },
    "03 Hours Before": { hours: 3 },
    "01 Hours Before": { hours: 1 },
    "30 Minutes Before": { minutes: 30 },
  };

  if (!timeMapping[selectedOption]) {
    throw new Error("Invalid notification time option selected");
  }
  if (!NOTIFICATION_TIME.includes(selectedOption)) {
    throw new Error("Invalid notification time option selected from system");
  }

  const eventMoment = moment(eventDate);

  const notificationTime = eventMoment.subtract(timeMapping[selectedOption]);

  return notificationTime;
}

const getEventById = async (id) => {
  const event = await Event.findOne({ _id: id, isDeleted: false });
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
      alertType,
      location,
      categoryId,
      latitude,
      longitude,
      isAutoDelete = false,
      recurringType,
    } = eventBody;
    const isRecurring = recurringType == "DOES NOT REPEAT" ? false : true;

    const userId = user._id;

    const { valid, reason } = validateEventDates(startDate, endDate);
    if (!valid) {
      throw new ApiError(httpStatus.BAD_REQUEST, reason);
    }

    if (recurringType == "MONTHLY") {
      const dates = getMonthlyRecurrences(normalizeDateString(startDate), normalizeDateString(endDate));
      if (!dates.includes(endDate)) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "For monthly recurrences, the end date must fall on the same day of the following month as the start date."
        );
      }
    }

    const event = await Event.create(
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
          isAutoDelete,
          isRecurring,
          recurringType,
        },
      ],
      { session }
    );

    if (alertType) {
      await UserCalendar.create(
        [
          {
            eventId: event[0]._id,
            userId,
            date: startDate,
            location,
            alertType,
          },
        ],
        { session }
      );
    }

    await session.commitTransaction();

    session.endSession();

    return { event: event[0] };
  } catch (error) {
    console.log("~ createEvent ~ error:", error);
    await session.abortTransaction();
    session.endSession();
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const getEvent = async (eventId) => {
  const event = await getEventById(eventId);
  let formattedEvent = JSON.parse(JSON.stringify(event));
  const userCalendar = await UserCalendar.findOne({
    isDeleted: false,
    eventId: eventId,
  });
  if (userCalendar) {
    formattedEvent.isNotify = true;
    formattedEvent.alertType = userCalendar.alertType;
  } else {
    formattedEvent.isNotify = false;
    formattedEvent.alertType = "";
  }

  return formattedEvent;
};

const deleteEvent = async (eventId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const event = await Event.findOne({
      _id: eventId,
      userId: userId,
      isDeleted: false,
    }).session(session);

    if (!event) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No event found.");
    }

    if (event.isAdmin) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Cannot delete this event added by Admin."
      );
    }

    event.isDeleted = true;
    await event.save({ session });

    await UserCalendar.updateMany(
      { eventId, userId },
      { $set: { isDeleted: true } },
      { session }
    );

    // await Score.updateMany(
    //   { eventId, userId },
    //   { $set: { isDeleted: true } },
    //   { session }
    // );

    await session.commitTransaction();
    session.endSession();

    return event;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Unable to delete event. Please try again later."
    );
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
      alertType,
    } = eventBody;
    const userId = user._id;

    const event = await Event.findOne({
      _id: eventId,
      userId,
      isDeleted: false,
    }).session(session);

    if (!event) {
      await session.abortTransaction();
      session.endSession();
      throw new ApiError(httpStatus.BAD_REQUEST, "Event not found.");
    }

    if (event.isAdmin) {
      await session.abortTransaction();
      session.endSession();
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Cannot edit this event added by Admin."
      );
    }

    if (name) event.name = name;
    if (startDate) event.startDate = startDate;
    if (endDate) event.endDate = endDate;
    if (categoryId) event.categoryId = categoryId;
    if (latitude) event.latitude = latitude;
    if (longitude) event.longitude = longitude;
    if (location) event.location = location;

    if (alertType) {
      let userCalendar = await UserCalendar.findOne({
        eventId: eventId,
        userId: userId,
      }).session(session);
      if (userCalendar) {
        if (userCalendar.alertType != alertType) {
          userCalendar.alertType = alertType;
          userCalendar.location = location;
          await userCalendar.save({ session });
        }
      } else {
        await UserCalendar.create(
          [{ eventId: eventId, userId, date: startDate, location, alertType }],
          { session }
        );
      }
    } else {
      await UserCalendar.deleteMany({ eventId, userId }, { session });
    }

    await event.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { event };
  } catch (error) {
    console.log("🚀 ~ editEvent ~ error:", error);
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

// const listEvents = async (reqBody, userId) => {
//   let { page = 1, limit = 10, isAdmin, search, date } = reqBody;

//   let filter = { userId: userId, isDeleted: false };
 

//   // Drop startOfDay/endOfDay since we’re now using recurrence logic AFTER aggregation.
//   if (isAdmin) {
//     filter = { isAdmin: true, isDeleted: false };
//   }

//   if (search) {
//     filter.$or = [
//       { name: { $regex: `.*${search.toLowerCase()}.*`, $options: "i" } },
//       { location: { $regex: `.*${search.toLowerCase()}.*`, $options: "i" } },
//     ];
//   }

//   // 🚦 Build the aggregation
//   let pipeline = [
//     { $match: filter },
//     {
//       $lookup: {
//         from: "categories",
//         localField: "categoryId",
//         foreignField: "_id",
//         as: "category",
//       },
//     },
//     { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
//     {
//       $lookup: {
//         from: "usercalendars",
//         let: {
//           userIdObj: new mongoose.Types.ObjectId(userId),
//           eventId: "$_id",
//         },
//         pipeline: [
//           {
//             $match: {
//               $expr: {
//                 $and: [
//                   { $eq: ["$userId", "$$userIdObj"] },
//                   { $eq: ["$eventId", "$$eventId"] },
//                 ],
//               },
//             },
//           },
//         ],
//         as: "eventNotified",
//       },
//     },
//     { $unwind: { path: "$eventNotified", preserveNullAndEmptyArrays: true } },
//     {
//       $addFields: {
//         isNotify: {
//           $cond: {
//             if: { $gt: [{ $type: "$eventNotified" }, "missing"] },
//             then: true,
//             else: false,
//           },
//         },
//         alertType: {
//           $cond: {
//             if: { $gt: [{ $type: "$eventNotified" }, "missing"] },
//             then: "$eventNotified.alertType",
//             else: "",
//           },
//         },
//       },
//     },
//     {
//       $project: {
//         _id: 1,
//         name: 1,
//         startDate: 1,
//         endDate: 1,
//         location: 1,
//         longitude: 1,
//         latitude: 1,
//         isAdmin: 1,
//         isNotify: 1,
//         alertType: 1,
//         recurringType: 1,
//         category: { _id: 1, name: 1, image: 1 },
//       },
//     },
//     { $sort: { startDate: -1 } },
//     {
//       $facet: {
//         totalRecords: [{ $count: "total" }],
//         results: [{ $skip: (page - 1) * limit }, { $limit: limit }],
//       },
//     },
//     {
//       $addFields: {
//         totalRecords: {
//           $ifNull: [{ $arrayElemAt: ["$totalRecords.total", 0] }, 0],
//         },
//       },
//     },
//   ];

//   // Run aggregation
//   const [event] = await Event.aggregate(pipeline);

//   // Normalize output container
//   let data = {
//     totalRecords: 0,
//     results: [],
//     page,
//     totalPages: 0,
//   };

//   if (!event || event.totalRecords < 1) {
//     return data;
//   }

//   const formattedDate = date
//     ? new Date(date).toISOString().split("T")[0]
//     : null;
//     console.log(formattedDate)
//   let results = event.results
//     .map((ev) => {
//       const dates = getDatesBetweenWithRecurring(ev);
//       console.log(dates)
//       ev.availableDates = dates;

//       // if date filter provided — keep only matching events
//       if (formattedDate && !dates.includes(formattedDate)) {
//         return null; // skip this event later
//       }
//       return ev;
//     })
//     .filter(Boolean); // removes all nulls

//   const totalRecords = results.length;
//   const totalPages = Math.ceil(totalRecords / limit);

//   return {
//     totalRecords,
//     results,
//     page,
//     totalPages,
//   };
// };


const listEvents = async (reqBody, userId) => {
  let { page = 1, limit = 10, isAdmin, search, date } = reqBody;

  let filter = { userId, isDeleted: false };

  if (isAdmin) {
    filter = { isAdmin: true, isDeleted: false };
  }

  if (search) {
    filter.$or = [
      { name: { $regex: `.*${search.toLowerCase()}.*`, $options: "i" } },
      { location: { $regex: `.*${search.toLowerCase()}.*`, $options: "i" } },
    ];
  }

  const pipeline = [
    { $match: filter },
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "usercalendars",
        let: {
          userIdObj: new mongoose.Types.ObjectId(userId),
          eventId: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$userId", "$$userIdObj"] },
                  { $eq: ["$eventId", "$$eventId"] },
                ],
              },
            },
          },
        ],
        as: "eventNotified",
      },
    },
    { $unwind: { path: "$eventNotified", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        isNotify: { $cond: [{ $ifNull: ["$eventNotified", false] }, true, false] },
        alertType: {
          $cond: [{ $ifNull: ["$eventNotified.alertType", false] }, "$eventNotified.alertType", ""],
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        startDate: 1,
        endDate: 1,
        location: 1,
        longitude: 1,
        latitude: 1,
        isAdmin: 1,
        isNotify: 1,
        alertType: 1,
        recurringType: 1,
        category: { _id: 1, name: 1, image: 1 },
      },
    },
    { $sort: { startDate: -1 } },
  ];

  if (!date) {
    pipeline.push(
      {
        $facet: {
          totalRecords: [{ $count: "total" }],
          results: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ],
        },
      },
      {
        $addFields: {
          totalRecords: {
            $ifNull: [{ $arrayElemAt: ["$totalRecords.total", 0] }, 0],
          },
        },
      }
    );
  } else {
    pipeline.push({
      $facet: {
        totalRecords: [{ $count: "total" }],
        results: [{ $match: {} }], 
      },
    });
  }

  const [event] = await Event.aggregate(pipeline);

  let data = { totalRecords: 0, results: [], page, totalPages: 0 };
  if (!event || event.totalRecords < 1) return data;

  const formattedDate = date ? new Date(date).toISOString().split("T")[0] : null;

  let results = event.results
    .map((ev) => {
      const dates = getDatesBetweenWithRecurring(ev);
      ev.availableDates = dates;
      if (formattedDate && !dates.includes(formattedDate)) return null;
      return ev;
    })
    .filter(Boolean);

  const totalRecords = results.length;
  const totalPages = date ? 1 : Math.ceil(totalRecords / limit);

  return { totalRecords, results, page, totalPages };
};


const userCalendarList = async (userId) => {
  const todayDate = new Date();
  let pipeline = [
    {
      $match: {
        isDeleted: false,
        //endDate: { $gte: todayDate },
        $or: [
          { isAdmin: true },
          { userId: new mongoose.Types.ObjectId(userId) },
        ],
      },
    },
    {
      $group: {
        _id: null,
        adminEvents: {
          $push: { $cond: [{ $eq: ["$isAdmin", true] }, "$$ROOT", "$$REMOVE"] },
        },
        myEvents: {
          $push: {
            $cond: [{ $eq: ["$isAdmin", false] }, "$$ROOT", "$$REMOVE"],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        adminEvents: 1,
        myEvents: 1,
      },
    },
  ];

  const events = await Event.aggregate(pipeline);

  let myEvents = [];
  let adminEvents = [];

  if (events.length <= 0) {
    return {
      myEvents: [],
      adminEvents: [],
    };
  }

  if (events[0].myEvents.length > 0) {
    for (event of events[0].myEvents) {
      let dates = getDatesBetweenWithRecurring(event);
      myEvents.push(...dates);
    }
  }

  if (events[0].adminEvents.length > 0) {
    for (event of events[0].adminEvents) {
      let dates = getDatesBetweenWithRecurring(event);
      adminEvents.push(...dates);
    }
  }

  myEvents = [...new Set(myEvents)];
  adminEvents = [...new Set(adminEvents)];

  return {
    myEvents,
    adminEvents,
  };
};

// function validateEventDates(startDateStr, endDateStr) {
//   const now = new Date();
//   now.setHours(0, 0, 0, 0);

//   const start = new Date(normalizeDateString(startDateStr));
//   const end = new Date(normalizeDateString(endDateStr));

//   // Normalize to date-only
//   start.setHours(0, 0, 0, 0);
//   end.setHours(0, 0, 0, 0);

//   // Max allowed = today + 2 years
//   const maxAllowed = new Date(now);
//   maxAllowed.setFullYear(now.getFullYear() + 2);

//   if (isNaN(start.getTime()) || isNaN(end.getTime())) {
//     return { valid: false, reason: "Invalid date format" };
//   }

//   if (start < now) {
//     return {
//       valid: false,
//       reason: "Start date must be today or in the future",
//     };
//   }

//   if (end < start) {
//     return {
//       valid: false,
//       reason: "End date must be after or equal to start date",
//     };
//   }

//   if (end > maxAllowed) {
//     return {
//       valid: false,
//       reason: "End date must be within 2 years from today",
//     };
//   }

//   return { valid: true };
// }


function validateEventDates(startDateStr, endDateStr) {
  const now = new Date();
  const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const start = Date.parse(normalizeDateString(startDateStr)); 
  const end = Date.parse(normalizeDateString(endDateStr));


  const maxAllowed = new Date(nowUTC);
  maxAllowed.setUTCFullYear(new Date(nowUTC).getUTCFullYear() + 2);

  if (isNaN(start) || isNaN(end)) return { valid: false, reason: "Invalid date format" };
  if (start < nowUTC) return { valid: false, reason: "Start date must be today or in the future" };
  if (end < start) return { valid: false, reason: "End date must be after or equal to start date" };
  if (end > maxAllowed) return { valid: false, reason: "End date must be within 2 years" };

  return { valid: true };
}

function getMonthlyRecurrences(startDate, endDate, separator = "/") {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const results = [];

  const targetWeekday = start.getDay(); // 0=Sunday ... 6=Saturday
  const nthWeekday = Math.ceil(start.getDate() / 7); // which occurrence (nth weekday)

  let current = new Date(start);

  while (current <= end) {
    // Move to next month
    const nextMonth = new Date(
      current.getFullYear(),
      current.getMonth() + 1,
      1
    );

    // All occurrences of target weekday in the next month
    const occurrences = [];
    const year = nextMonth.getFullYear();
    const month = nextMonth.getMonth();

    for (let d = 1; d <= 31; d++) {
      const date = new Date(year, month, d);
      if (date.getMonth() !== month) break; // stop when month overflows
      if (date.getDay() === targetWeekday) occurrences.push(date);
    }

    // Pick nth weekday or fallback to last occurrence
    const recurringDate =
      occurrences[nthWeekday - 1] || occurrences[occurrences.length - 1];

    if (recurringDate > end) break;
    results.push(recurringDate);
    current = recurringDate;
  }

  // Include start date as first occurrence
  results.unshift(start);

  // Format results to local date string with separator
  const formatted = results.map((date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}${separator}${m}${separator}${d}`;
  });

  return formatted;
}

function getDatesBetweenWithRecurring(event) {
  let { startDate, endDate, recurringType } = event;

  recurringType =
    !recurringType || recurringType === "DOES NOT REPEAT"
      ? "DAILY"
      : recurringType.toUpperCase();

  // Handle MONTHLY recurrence via getMonthlyRecurrences
  if (recurringType === "MONTHLY") {
    return getMonthlyRecurrences(startDate, endDate, "-");
  }

  // Otherwise fall back to generic date stepping
  const dates = [];
  let currentDate = new Date(startDate);
  const lastDate = new Date(endDate);

  let stepDays;
  switch (recurringType) {
    case "WEEKLY":
      stepDays = 7;
      break;
    case "BIWEEKLY":
      stepDays = 14;
      break;
    case "DAILY":
    default:
      stepDays = 1;
  }

  while (currentDate <= lastDate) {
    // Format YYYY-MM-DD for consistency
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(currentDate.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);

    currentDate.setDate(currentDate.getDate() + stepDays);
  }

  return dates;
}

const notifyEvent = async (eventBody, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { eventId, alertType } = eventBody;
    const userId = user._id;

    const event = await Event.findOne({
      _id: eventId,
      isDeleted: false,
    }).session(session);

    if (!event) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Event not found.");
    }

    if (alertType) {
      let userCalendar = await UserCalendar.findOne({
        eventId: eventId,
        userId: userId,
      }).session(session);
      if (!userCalendar) {
        await UserCalendar.create(
          [
            {
              eventId: eventId,
              userId,
              date: event.startDate,
              location: event.location,
              alertType,
            },
          ],
          { session }
        );
      }
    } else {
      await UserCalendar.deleteMany({ eventId, userId }, { session });
    }

    await event.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { event };
  } catch (error) {
    console.log("🚀 ~ editEvent ~ error:", error);
    await session.abortTransaction();
    session.endSession();

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Unable to notify event. Please try again later."
    );
  }
};

module.exports = {
  getEventById,
  createEvent,
  getEvent,
  deleteEvent,
  editEvent,
  listEvents,
  userCalendarList,
  notifyEvent,
  getDatesBetweenWithRecurring,
};
