const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { verifyToken } = require("../middleware/authMiddleware");



router.get("/conversations", verifyToken, chatController.getConversations);


router.post("/conversations", verifyToken, chatController.createConversation);


router.get("/conversations/:id", verifyToken, chatController.getConversationDetails);




router.get("/conversations/:conversationId/messages", verifyToken, chatController.getMessages);


router.post("/messages", verifyToken, chatController.sendMessage);

module.exports = router;