const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  multerAvatarUpload,
  multerCoverUpload,
} = require("../middleware/storage");
const {
  uploadAvatar,
  uploadPhoto,
  deletePhoto,
  uploadGroupAvatar,
} = require("../controllers/upload.controller");

router.post("/avatar", verifyToken, multerAvatarUpload, uploadAvatar);

router.post("/cover", verifyToken, multerCoverUpload, uploadPhoto);

router.post(
  "/group/:conversationId",
  verifyToken,
  multerAvatarUpload,
  uploadGroupAvatar,
);

router.delete("/photo", verifyToken, deletePhoto);

module.exports = router;
