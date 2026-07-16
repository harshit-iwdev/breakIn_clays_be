require("dotenv").config();
const crypto = require("crypto");
const path = require("path");

const {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  ListObjectsCommand,
  PutObjectCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

let bucketBaseUrl = process.env.AWS_BUCKET_NAME;

module.exports.makePresignedURL = async (pathName) => {
  const myBucket = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  let replacedPath = pathName.replace(/ /g, "+");
  const publicUrl = `https://${myBucket}.s3.${region}.amazonaws.com/${replacedPath}`;

  // If you ever want to generate a signed URL:
  // const command = new GetObjectCommand({ Bucket: myBucket, Key: pathName });
  // const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return publicUrl;
};

module.exports.generateUrl = (url) => {
  if (url) {
    return `${bucketBaseUrl}/${url}`;
  }
  return "";
};

module.exports.renameFile = async (sourceFile, newFileName) => {
  try {
    const myBucket = process.env.AWS_BUCKET_NAME;

    await s3Client.send(new CopyObjectCommand({
      Bucket: myBucket,
      CopySource: `${myBucket}/${sourceFile}`,
      Key: newFileName,
      ACL: 'public-read',
    }));

    await s3Client.send(new DeleteObjectCommand({
      Bucket: myBucket,
      Key: sourceFile,
    }));
  } catch (e) {
    console.error("Error during renameFile:", e.stack);
  }
};

module.exports.deleteFile = async (sourceFile) => {
  try {
    const myBucket = process.env.AWS_BUCKET_NAME;

    await s3Client.send(new DeleteObjectCommand({
      Bucket: myBucket,
      Key: sourceFile,
    }));
  } catch (e) {
    console.error("Error from deleteFile:", e.stack);
  }
};

module.exports.getFileList = async (folderName) => {
  try {
    const myBucket = process.env.AWS_BUCKET_NAME;

    const data = await s3Client.send(new ListObjectsCommand({
      Bucket: myBucket,
      Prefix: folderName,
    }));

    return data;
  } catch (e) {
    console.error("Error from getFileList:", e.stack);
  }
};

module.exports.uploadFile = async (file, folderName, fileName) => {
  try {
    const myBucket = process.env.AWS_BUCKET_NAME;

    const command = new PutObjectCommand({
      Bucket: myBucket,
      Key: `${folderName}/${fileName}`,
      Body: file,
      ACL: 'public-read',
    });

    await s3Client.send(command);
    return `https://${myBucket}.s3.ap-south-1.amazonaws.com/${folderName}/${fileName}`;
  } catch (err) {
    throw err;
  }
};

module.exports.createUrl = async (image, newFolderPath) => {
  if (image) {
    let tempImagePath = module.exports.tempFolderPath + "/" + image;
    let newImagePath = newFolderPath + "/" + image;
    await module.exports.renameFile(tempImagePath, newImagePath);
    const signedURL = await module.exports.makePresignedURL(newImagePath);
    return signedURL;
  }
  return image;
};

module.exports.deleteObject = async (image, folderPath) => {
  let imagePath = folderPath + "/" + image;
  await module.exports.deleteFile(imagePath);
  return true;
};

module.exports.bucketBaseUrl = bucketBaseUrl;
module.exports.tempFolderPath = process.env.AWS_BUCKET_TEMP_FOLDER;
module.exports.profileFolderPath = process.env.AWS_BUCKET_PROFILE_FOLDER;
module.exports.categoryFolderPath = process.env.AWS_BUCKET_CATEGORY_FOLDER;
module.exports.eventFolderPath = process.env.AWS_BUCKET_EVENT_FOLDER;
module.exports.sponsorFolderPath = process.env.AWS_BUCKET_SPONSOR_FOLDER;
module.exports.patchFolderPath = process.env.AWS_BUCKET_PATCH_FOLDER;
module.exports.scoreFolderPath = process.env.AWS_BUCKET_SCORE_FOLDER;

/**
 * Generates a short-lived presigned URL the client can use to PUT a file directly to S3,
 * into the temp folder. The returned fileName must be sent back to the relevant
 * create/update endpoint, which moves the file out of temp via createUrl().
 * @param {string} fileName - original file name (used only to keep the extension)
 * @param {string} [contentType] - MIME type of the file being uploaded
 * @returns {Promise<{uploadUrl: string, fileName: string}>}
 */
module.exports.getUploadSignedUrl = async (fileName, contentType) => {
  const myBucket = process.env.AWS_BUCKET_NAME;
  const ext = path.extname(fileName);
  const uniqueFileName = `${Date.now()}_${crypto.randomBytes(8).toString("hex")}${ext}`;
  const key = `${module.exports.tempFolderPath}/${uniqueFileName}`;

  const command = new PutObjectCommand({
    Bucket: myBucket,
    Key: key,
    ContentType: contentType,
    ACL: "public-read",
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return { uploadUrl, fileName: uniqueFileName };
};