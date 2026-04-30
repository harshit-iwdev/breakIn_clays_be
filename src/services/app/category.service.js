const { pipeline } = require("nodemailer/lib/xoauth2");
const { Category, Sponsor, User } = require("../../models");
const ApiError = require("../../utils/ApiError");
const httpStatus = require("http-status");
const mongoose = require("mongoose");
const MAX_FAVORITE_CATEGORIES = 3;

const normalizeFavoriteCategoryIds = (favoriteCategoryIds = []) =>
  favoriteCategoryIds
    .map((favorite) => {
      if (!favorite) {
        return null;
      }

      if (
        favorite.categoryId &&
        mongoose.Types.ObjectId.isValid(favorite.categoryId)
      ) {
        return favorite.categoryId.toString();
      }

      if (mongoose.Types.ObjectId.isValid(favorite)) {
        return favorite.toString();
      }

      return null;
    })
    .filter(Boolean);

const normalizeFavoriteCategoryEntries = (favoriteCategoryIds = []) =>
  favoriteCategoryIds
    .map((favorite) => {
      if (!favorite) {
        return null;
      }

      if (
        favorite.categoryId &&
        mongoose.Types.ObjectId.isValid(favorite.categoryId)
      ) {
        return {
          categoryId: favorite.categoryId.toString(),
          addedAt: favorite.addedAt ? new Date(favorite.addedAt) : new Date(0),
        };
      }

      if (mongoose.Types.ObjectId.isValid(favorite)) {
        return {
          categoryId: favorite.toString(),
          addedAt: new Date(0),
        };
      }

      return null;
    })
    .filter(Boolean)
    .sort((first, second) => second.addedAt - first.addedAt);

const buildFavoriteCategoryPayload = (favoriteCategoryIds = [], categoryId) => {
  const now = new Date();
  const normalizedFavorites = normalizeFavoriteCategoryEntries(favoriteCategoryIds)
    .filter((favorite) => favorite.categoryId !== categoryId);

  normalizedFavorites.unshift({ categoryId, addedAt: now });

  return normalizedFavorites.slice(0, MAX_FAVORITE_CATEGORIES).map((favorite) => ({
    categoryId: new mongoose.Types.ObjectId(favorite.categoryId),
    addedAt: favorite.addedAt,
  }));
};

const getCategoryById = async (id) => {
  const category = await Category.findOne({ _id: id, isDeleted: false });
  if (!category) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Category not found.");
  }
  return category;
};

///previous method
const listCategory = async (reqBody, userId) => {
  const { page = 1, limit = 10, isHome = true, favoritesFirst = false } = reqBody;
  const user = await User.findById(userId).select("favoriteCategoryIds").lean();
  const favoriteEntries = normalizeFavoriteCategoryEntries(user?.favoriteCategoryIds);
  const favoriteCategoryIds = favoriteEntries.map(
    (favorite) => new mongoose.Types.ObjectId(favorite.categoryId)
  );

  const filter = {};

  const projectFields = {
    _id: 1,
    name: 1,
    isDeleted: 1,
    createdAt: 1,
    updatedAt: 1,
    image: 1,
    scoreDate: 1,
  };

  const pipeline = [
    { $match: filter },
    {
      $lookup: {
        from: "scores",
        localField: "_id",
        foreignField: "categoryId",
        let: { categoryId: "$_id" },
        as: "score",
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$categoryId", "$$categoryId"] },
                  { $eq: ["$userId", new mongoose.Types.ObjectId(userId)] },
                  { $eq: ["$isDeleted", false] },
                ],
              },
            },
          },
          { $sort: { scoreDate: -1 } },
          { $limit: 1 },
        ],
      },
    },
    {
      $unwind: {
        path: "$score",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "scores",
        localField: "_id",
        foreignField: "categoryId",
        as: "totalScore",
        pipeline: [
          {
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
              isDeleted: false,
            },
          },
          { $sort: { scoreDate: -1 } },
        ],
      },
    },
    {
      $lookup: {
        from: "analysisrecords",
        localField: "_id",
        foreignField: "categoryId",
        as: "analysisRecord",
        pipeline: [
          {
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
              isDeleted: false,
            },
          },
          { $limit: 1 },
        ],
      },
    },
    {
      $unwind: {
        path: "$analysisRecord",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        totalScore: { $size: { $ifNull: ["$totalScore", []] } },
        isFavorite: { $in: ["$_id", favoriteCategoryIds] },
        favoriteAddedAt: {
          $let: {
            vars: {
              favoriteMatch: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: user?.favoriteCategoryIds || [],
                      as: "favorite",
                      cond: { $eq: ["$$favorite.categoryId", "$_id"] },
                    },
                  },
                  0,
                ],
              },
            },
            in: "$$favoriteMatch.addedAt",
          },
        },
        scoreDate: {
          $cond: {
            if: { $gt: [{ $size: { $ifNull: ["$totalScore", []] } }, 0] },
            then: "$score.scoreDate",
            else: null,
          },
        },
      },
    },
    {
      $sort: favoritesFirst
        ? { isFavorite: -1, favoriteAddedAt: -1, createdAt: 1 }
        : { createdAt: 1 },
    },
    {
      $project: {
        ...projectFields,
        isFavorite: 1,
        ...(isHome
          ? {}
          : { totalScore: 1, recordDate: "$analysisRecord.recordDate" }),
      },
    },
    {
      $facet: {
        totalRecords: [{ $count: "total" }],
        results: [{ $skip: (page - 1) * limit }, { $limit: limit }],
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

  let category = await Category.aggregate(pipeline);
  category = category[0];

  return {
    totalRecords: category.totalRecords,
    results: category.results,
    page,
    totalPages: Math.ceil(category.totalRecords / limit),
  };
};

const listSponsor = async (reqBody) => {
  const {
    page = 1,
    limit = 10,
    categoryId,
    search,
    sortKey = "createdAt",
    sortOrder = -1,
  } = reqBody;

  let sortObject = {};

  sortObject[sortKey] = sortOrder;

  let filter = { isDeleted: false };
  if (categoryId) {
    filter.categoryId = new mongoose.Types.ObjectId(categoryId);
  }
  if (search) {
    filter.$or = [
      { name: { $regex: `.*${search.toLowerCase()}.*`, $options: "i" } },
      { tagLine: { $regex: `.*${search.toLowerCase()}.*`, $options: "i" } },
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
    { $sort: sortObject },
    {
      $facet: {
        totalRecords: [{ $count: "total" }],
        results: [{ $skip: (page - 1) * limit }, { $limit: limit }],
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

  let sponsor = await Sponsor.aggregate(pipeline);
  sponsor = sponsor[0];
  let totalRecords = sponsor.totalRecords;

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
      results: sponsor.results,
      page: page,
      totalPages: Math.ceil(totalRecords / limit),
    };
  }

  return data;
};

const addFavoriteCategory = async (categoryId, userId) => {
  await getCategoryById(categoryId);

  const existingUser = await User.findOne({ _id: userId, isDeleted: false })
    .select("favoriteCategoryIds")
    .lean();

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  const favoriteCategoryPayload = buildFavoriteCategoryPayload(
    existingUser.favoriteCategoryIds,
    categoryId
  );

  const user = await User.findOneAndUpdate(
    { _id: userId, isDeleted: false },
    { $set: { favoriteCategoryIds: favoriteCategoryPayload } },
    { new: true }
  ).select("favoriteCategoryIds");

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  return normalizeFavoriteCategoryIds(user.favoriteCategoryIds);
};

const removeFavoriteCategory = async (categoryId, userId) => {
  const existingUser = await User.findOne({ _id: userId, isDeleted: false })
    .select("favoriteCategoryIds")
    .lean();

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  const favoriteCategoryPayload = normalizeFavoriteCategoryEntries(
    existingUser.favoriteCategoryIds
  )
    .filter((favorite) => favorite.categoryId !== categoryId)
    .map((favorite) => ({
      categoryId: new mongoose.Types.ObjectId(favorite.categoryId),
      addedAt: favorite.addedAt,
    }));

  const user = await User.findOneAndUpdate(
    { _id: userId, isDeleted: false },
    { $set: { favoriteCategoryIds: favoriteCategoryPayload } },
    { new: true }
  ).select("favoriteCategoryIds");

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  return normalizeFavoriteCategoryIds(user.favoriteCategoryIds);
};

module.exports = {
  listCategory,
  getCategoryById,
  listSponsor,
  addFavoriteCategory,
  removeFavoriteCategory,
};
