const AWSManager = require('../../utils/aws');

const getUploadUrl = async ({ fileName, contentType }) => {
  return AWSManager.getUploadSignedUrl(fileName, contentType);
};

module.exports = {
  getUploadUrl,
};
