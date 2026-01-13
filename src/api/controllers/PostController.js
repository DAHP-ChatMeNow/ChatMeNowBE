const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");


exports.getNewsFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const posts = await Post.find({ privacy: "public" }) 
      .sort({ createdAt: -1 }) 
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("authorId", "displayName avatar"); 

    res.status(200).json({
      success: true,
      posts,
      total: posts.length,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { content, privacy } = req.body;
    

    const newPost = await Post.create({
      authorId: userId,
      content,
      privacy
    });

    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.getPostDetail = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("authorId", "displayName avatar");
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.toggleLikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

    
    
    const isLiked = post.likes && post.likes.includes(userId);

    if (isLiked) {
      
      await Post.findByIdAndUpdate(postId, {
        $pull: { likes: userId },
        $inc: { likesCount: -1 }
      });
      res.status(200).json({ message: "Unliked" });
    } else {
      
      await Post.findByIdAndUpdate(postId, {
        $addToSet: { likes: userId },
        $inc: { likesCount: 1 }
      });

      
      if (post.authorId.toString() !== userId) {
        await Notification.create({
          recipientId: post.authorId,
          senderId: userId,
          type: "like_post",
          referenceId: postId,
          message: "đã thích bài viết của bạn."
        });
      }
      
      res.status(200).json({ message: "Liked" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unlikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

    await Post.findByIdAndUpdate(postId, {
      $pull: { likes: userId },
      $inc: { likesCount: -1 }
    });

    res.status(200).json({ success: true, message: "Unliked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ postId })
      .sort({ createdAt: 1 }) 
      .populate("userId", "displayName avatar");
      
    res.status(200).json({
      success: true,
      comments,
      total: comments.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.addComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.params;
    const { content } = req.body;

    const newComment = await Comment.create({
      postId,
      userId,
      content
    });

    
    const post = await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    
    await newComment.populate("userId", "displayName avatar");

    
    if (post && post.authorId.toString() !== userId) {
        await Notification.create({
          recipientId: post.authorId,
          senderId: userId,
          type: "comment",
          referenceId: postId,
          message: "đã bình luận về bài viết của bạn."
        });
    }

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};