const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { multerUploads } = require("../middleware/storage");
const {
  uploadAvatar,
  uploadPhoto,
  deletePhoto,
} = require("../controllers/upload.controller");

router.post("/avatar", authMiddleware, multerUploads, uploadAvatar);

router.post("/photo", authMiddleware, multerUploads, uploadPhoto);

router.delete("/photo", authMiddleware, deletePhoto);

module.exports = router;
