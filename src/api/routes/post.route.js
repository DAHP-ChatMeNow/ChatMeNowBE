const express = require("express");
const router = express.Router();
const postController = require("../controllers/PostController");
const { verifyToken } = require("../middleware/authMiddleware");


router.post("/", verifyToken, postController.createPost);


router.get("/feed", verifyToken, postController.getNewsFeed);


router.get("/:id", verifyToken, postController.getPostDetail);


router.put("/:id/like", verifyToken, postController.toggleLikePost);



router.get("/:postId/comments", verifyToken, postController.getComments);


router.post("/:postId/comments", verifyToken, postController.addComment);

module.exports = router;