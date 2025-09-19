const Joi = require("joi");
const { objectId } = require("./custom.validation");
const { SCORE_EVENT_TYPE, SHOT_TYPE } = require("../../config/config");
const moment = require("moment");

// Extend SHOT_TYPE to allow numbered variants for REPORT_PAIR and TRUE_PAIR (e.g., REPORT_PAIR_1..20)
const EXTENDED_SHOT_TYPE = (() => {
  const reportPairVariants = Array.from(
    { length: 20 },
    (_, idx) => `REPORT_PAIR_${idx + 1}`
  );
  const truePairVariants = Array.from(
    { length: 20 },
    (_, idx) => `TRUE_PAIR_${idx + 1}`
  );
  return [...SHOT_TYPE, ...reportPairVariants, ...truePairVariants];
})();

const add = {
  body: Joi.object({
    _id: Joi.string().allow(null, ""),
    location: Joi.string().required(),
    latitude: Joi.string()
      .pattern(/^-?\d+(\.\d+)?$/)
      .required(), // Ensures it's a valid decimal number
    longitude: Joi.string()
      .pattern(/^-?\d+(\.\d+)?$/)
      .required(),
    categoryId: Joi.string().required().custom(objectId),
    eventType: Joi.string().valid(...SCORE_EVENT_TYPE),
    noOfRounds: Joi.number().integer().min(1).required(),
    handicap: Joi.string().required().allow(""),
    rounds: Joi.array()
      .items(
        Joi.object({
          _id: Joi.string().allow(null, ""),
          roundNo: Joi.number().integer().min(1).required(),
          roundScore: Joi.number().integer().min(0).required(),
          roundShots: Joi.number().integer().min(1).required(),
          note: Joi.string().allow("", null),
          posts: Joi.array()
            .items(
              Joi.object({
                _id: Joi.string().allow(null, ""),
                post: Joi.number().integer().min(1).required(),
                postName: Joi.string().required(),
                shots: Joi.array()
                  .items(
                    Joi.object({
                      type: Joi.string()
                        .valid(...EXTENDED_SHOT_TYPE)
                        .required(),
                      shot: Joi.number().integer().min(1).required(),
                      score: Joi.number().integer().min(0).max(1).required(),
                    })
                  )
                  .min(1)
                  .required(),
              })
            )
            .min(1)
            .required(),
        })
      )
      .min(1)
      .required(),
    totalScore: Joi.number().integer().min(0).required(),
    isDeleted: Joi.boolean().required(),
    scoreImage: Joi.string().allow(""),
    scoreDate: Joi.date().required(),
    totalShots: Joi.number().integer().min(0).required(),
    gunId: Joi.string().custom(objectId).allow("", null),
    eventId: Joi.string().custom(objectId),
  }),
};

const edit = {
  body: Joi.object({
    _id: Joi.string().required().allow(null, "").custom(objectId),
    location: Joi.string().required(),
    latitude: Joi.string()
      .pattern(/^-?\d+(\.\d+)?$/)
      .required(), // Ensures it's a valid decimal number
    longitude: Joi.string()
      .pattern(/^-?\d+(\.\d+)?$/)
      .required(),
    categoryId: Joi.string().required().custom(objectId),
    eventType: Joi.string().valid(...SCORE_EVENT_TYPE),
    noOfRounds: Joi.number().integer().min(1).required(),
    handicap: Joi.string().required().allow(""),
    rounds: Joi.array()
      .items(
        Joi.object({
          _id: Joi.string().required().allow(null, "").custom(objectId),
          roundNo: Joi.number().integer().min(1).required(),
          roundScore: Joi.number().integer().min(0).required(),
          roundShots: Joi.number().integer().min(1).required(),
          note: Joi.string().allow("", null),
          posts: Joi.array()
            .items(
              Joi.object({
                _id: Joi.string().required().allow(null, "").custom(objectId),
                post: Joi.number().integer().min(1).required(),
                postName: Joi.string().required(),
                shots: Joi.array()
                  .items(
                    Joi.object({
                      type: Joi.string()
                        .valid(...EXTENDED_SHOT_TYPE)
                        .required(),
                      shot: Joi.number().integer().min(1).required(),
                      score: Joi.number().integer().min(0).max(1).required(),
                    })
                  )
                  .min(1)
                  .required(),
              })
            )
            .min(1)
            .required(),
        })
      )
      .min(1)
      .required(),
    totalScore: Joi.number().integer().min(0).required(),
    isDeleted: Joi.boolean().required(),
    scoreImage: Joi.string().allow(""),
    scoreDate: Joi.date().required(),
    totalShots: Joi.number().integer().min(0).required(),
    gunId: Joi.string().custom(objectId).allow("", null),
    eventId: Joi.string().custom(objectId),
  }),
};

const get = {
  params: Joi.object().keys({
    scoreId: Joi.string().required().custom(objectId),
  }),
};

// const list = {
//   body: Joi.object().keys({
//     categoryId: Joi.string().required().custom(objectId),
//     search: Joi.string().allow(""),
//     limit: Joi.number(),
//     page: Joi.number(),
//     eventId: Joi.string().custom(objectId),
//   }),
// };

const dateFormat = Joi.string()
  .pattern(/^\d{4}\/\d{1,2}\/\d{1,2}$/, "date format (yyyy/mm/dd)")
  .optional()
  .custom((value, helpers) => {
    if (!value) return undefined;
    const parsedDate = moment(value, "YYYY/MM/DD", true);
    if (!parsedDate.isValid()) {
      return helpers.error("any.invalid");
    }
    return parsedDate.toDate();
  });

const list = {
  body: Joi.object().keys({
    categoryId: Joi.string().required().custom(objectId),
    search: Joi.string().allow(""),
    limit: Joi.number(),
    page: Joi.number(),
    eventId: Joi.string().custom(objectId),
    startDate: dateFormat.optional(),
    endDate: dateFormat.optional(),
    eventType: Joi.string()
      .valid(...SCORE_EVENT_TYPE)
      .optional()
      .messages({
        "any.only": `Invalid event type. Allowed types are: ${SCORE_EVENT_TYPE.join(", ")}.`,
      }),
  }),
};

const gunList = {
  body: Joi.object().keys({
    search: Joi.string().allow(""),
  }),
};

module.exports = {
  add,
  edit,
  get,
  list,
  gunList,
};
