const express = require("express");
const router = express.Router();
const userController = require('../controllers/UserController')
const { verifyToken } = require("../middleware/authMiddleware");


router.get("/search", verifyToken, userController.searchUsers);


router.get("/:id", verifyToken, userController.getUserProfile);


router.put("/profile", verifyToken, userController.updateProfile);



router.post("/friend-request", verifyToken, userController.sendFriendRequest);


router.put("/friend-request/:requestId", verifyToken, userController.respondFriendRequest);


router.get("/friend-requests/pending", verifyToken, userController.getPendingRequests);

module.exports = router;