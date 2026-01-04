const express = require("express");
const router = express.Router();
const userController = require('../controllers/UserController')
const { verifyToken } = require("../middleware/authMiddleware");


router.get("/search", verifyToken, userController.searchUsers);


router.get("/:id", verifyToken, userController.getUserProfile);

router.put("/profile", verifyToken, userController.updateProfile);

router.put("/avatar", verifyToken, userController.updateAvatar);

router.put("/cover-image", verifyToken, userController.updateCoverImage);



// Friend management endpoints
router.get("/contacts", verifyToken, userController.getContacts);

router.get("/friend-requests/pending", verifyToken, userController.getPendingRequests);

router.post("/friend-requests/:userId", verifyToken, userController.sendFriendRequest);

router.put("/friend-requests/:requestId/accept", verifyToken, userController.acceptFriendRequest);

router.put("/friend-requests/:requestId/reject", verifyToken, userController.rejectFriendRequest);

router.delete("/friends/:userId", verifyToken, userController.removeFriend);

// Legacy endpoints (keep for backward compatibility)
router.post("/friend-request", verifyToken, userController.sendFriendRequest);

router.put("/friend-request/:requestId", verifyToken, userController.respondFriendRequest);

module.exports = router;