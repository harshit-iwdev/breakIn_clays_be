const dotenv = require("dotenv");
const path = require("path");
const Joi = require("joi");

dotenv.config({ path: path.join(__dirname, "../../.env") });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .valid("production", "development", "test")
      .required(),
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description("Mongo DB url"),
    JWT_SECRET: Joi.string().required().description("JWT secret key"),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number()
      .default(30)
      .description("minutes after which access tokens expire"),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number()
      .default(30)
      .description("days after which refresh tokens expire"),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description("minutes after which reset password token expires"),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description("minutes after which verify email token expires"),
    SMTP_HOST: Joi.string().description("server that will send the emails"),
    SMTP_PORT: Joi.number().description("port to connect to the email server"),
    SMTP_USERNAME: Joi.string().description("username for email server"),
    SMTP_PASSWORD: Joi.string().description("password for email server"),
    EMAIL_FROM: Joi.string().description(
      "the from field in the emails sent by the app"
    ),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const GUN_PARTS = [
  "GAUGE",
  "BARREL",
  "RIB",
  "ACTION_TYPE",
  "CHOKE_MATERIAL",
  "CHOKE_SIZE",
  "CHOKE_TYPE",
  "COMB",
  "PULL_LENGTH",
];

const SCORE_EVENT_TYPE = ["SOCIAL", "PRACTICE", "COMPETITION", "VIRTUAL"];

const CONDITIONAL_CATEGORY = [
  "American Skeet",
  "International Skeet",
  "Olympic Skeet Finals",
];

const CONDITIONAL_GUN_PART = ["PULL_LENGTH", "COMB", "BARREL"];

const NOTIFICATION_TIME = ["DAY_BEFORE", "EVENT_DAY"];

const STATUS = ["PENDING", "APPROVED", "REJECTED"];

const QUERY_TYPE = ["GENERAL", "SPONSORSHIP", "FEATURE"];

const SHOT_TYPE = [
  "DOUBLE_HIGH",
  "DOUBLE_LOW",
  "SINGLE_HIGH",
  "SINGLE_LOW",
  "SINGLE",
  "PAIR_1",
  "PAIR_2",
  "REPORT_PAIR",
  "TRUE_PAIR",
];

const ANALYSIS_CATEGORY = [
  "American Trap",
  "International Trap",
  "American Skeet",
  "International Skeet",
];

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === "test" ? "-test" : ""),
    options: {},
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes:
      envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  GUN_PARTS,
  SCORE_EVENT_TYPE,
  QUERY_TYPE,
  CONDITIONAL_CATEGORY,
  SHOT_TYPE,
  STATUS,
  NOTIFICATION_TIME,
  CONDITIONAL_GUN_PART,
  ANALYSIS_CATEGORY,
};
