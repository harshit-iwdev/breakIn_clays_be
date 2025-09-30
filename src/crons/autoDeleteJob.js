const mongoose = require("mongoose");
const moment = require("moment");
const { Event, Score } = require("../models");

/**
 * Fetches events that are older than 30 days (based on createdAt)
 * @returns {Promise<Array>} List of old event documents
 */
async function getOldEvents() {
  try {
    const thirtyDaysAgo = moment().subtract(30, "days").toDate();

    const oldEvents = await Event.aggregate([
      {
        $match: {
          endDate: { $lt: thirtyDaysAgo },
          isDeleted: false,
          isAdmin: false,
          isAutoDelete: true,
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
      {
        $lookup: {
          from: "scores",
          let: { eventId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$eventId", "$$eventId"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            {
              $project: { _id: 1 },
            },
          ],
          as: "scores",
        },
      },
      {
        $project: {
          _id: 1,
          scoreIds: "$scores._id",
        },
      },
    ]);
    return oldEvents;
  } catch (error) {
    console.error("Error fetching old events:", error);
    throw error;
  }
}

/**
 * Marks events as deleted and their scores as eventDeleted based on input array
 * @param {Array} eventsWithScores - Array of objects like [{ _id, scoreIds }]
 */
async function markEventsAndScoresDeleted(eventsWithScores) {
  try {
    // Extract event IDs and score IDs separately
    const eventIds = eventsWithScores.map((e) => e._id);
    const scoreIds = eventsWithScores.flatMap((e) => e.scoreIds);

    // Update events: set isDeleted = true
    await Event.updateMany(
      { _id: { $in: eventIds } },
      { $set: { isDeleted: true } }
    );

    // Update scores: set isEventDeleted = true
    if (scoreIds.length > 0) {
      await Score.updateMany(
        { _id: { $in: scoreIds } },
        { $set: { isEventDeleted: true } }
      );
    }

    console.log(
      `Updated ${eventIds.length} events as deleted and ${scoreIds.length} scores as eventDeleted.`
    );
  } catch (error) {
    console.error("Error updating events and scores:", error);
    throw error;
  }
}

module.exports = {
  getOldEvents,
  markEventsAndScoresDeleted,
};
