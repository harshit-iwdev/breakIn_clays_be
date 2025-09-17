const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION,
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SES_SECRET_KEY,
  },
});

const FROM_EMAIL = process.env.AWS_SES_EMAIL_FROM || "ramsample1@gmail.com";

const compileTemplate = (templateName, replacements) => {
  const templatePath = path.join(__dirname, "..", "template", templateName);
  const templateSource = fs.readFileSync(templatePath, "utf8");
  const template = handlebars.compile(templateSource);
  return template(replacements);
};

const sendEmail = async ({ to, subject, html }) => {
  const command = new SendEmailCommand({
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: html } },
    },
    Source: `Breakin Clays <${FROM_EMAIL}>`,
  });

  try {
    const response = await sesClient.send(command);
    console.log("✅ Email sent:", response.MessageId);
  } catch (err) {
    console.error("❌ Email error:", err);
    throw err;
  }
};

module.exports.welcomeMail = async (email = "ramsample2@gmail.com", dynamicValue = {}) => {
  const html = compileTemplate("welcome.html", {
    user: dynamicValue.user,
    otp: dynamicValue.otp,
  });
  await sendEmail({ to: email, subject: "Welcome and verifying user", html });
};

module.exports.forgotPassword = async (email = "ramsample2@gmail.com", dynamicValue = {}) => {
  const html = compileTemplate("forgot.html", {
    user: dynamicValue.user,
    url: dynamicValue.url,
  });
  await sendEmail({ to: email, subject: "Reset Password", html });
};

module.exports.deleteMail = async (email = "ramsample2@gmail.com", dynamicValue = {}) => {
  const html = compileTemplate("delete.html", {
    user: dynamicValue.user,
    otp: dynamicValue.otp,
  });
  await sendEmail({ to: email, subject: "Delete Confirmation", html });
};