const multer = require("multer");
const DatauriParser = require("datauri/parser");
const path = require("path");
const cloudinary = require("../../config/cloudinary");

const storage = multer.memoryStorage();

const multerUploads = multer({ storage }).single("image");
const multerMultipleUploads = multer({ storage }).array("media", 10);
const multerAvatarUpload = multer({ storage }).single("image");
const multerCoverUpload = multer({ storage }).single("image");

const parser = new DatauriParser();

const formatBufferToDataURI = (file) =>
  parser.format(path.extname(file.originalname).toString(), file.buffer);

const uploadToCloudinary = (fileDataUri) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(fileDataUri, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });
  });
};

module.exports = {
  multerUploads,
  multerMultipleUploads,
  multerAvatarUpload,
  multerCoverUpload,
  formatBufferToDataURI,
  uploadToCloudinary,
};
