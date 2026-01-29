const postService = require("../service/post.service");
const {
  formatBufferToDataURI,
  uploadToCloudinary,
} = require("../middleware/storage");

exports.getNewsFeed = async (req, res) => {
  try {
    const result = await postService.getNewsFeed(req.user.userId, req.query);

    res.status(200).json({
      success: true,
      posts: result.posts,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { content, privacy } = req.body;

    const media = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileDataUri = formatBufferToDataURI(file);
        const uploadResult = await uploadToCloudinary(fileDataUri.content);
        media.push({
          url: uploadResult.secure_url,
          type: "image",
        });
      }
    }

    const populatedPost = await postService.createPost(userId, {
      content,
      privacy,
      media,
    });

    res.status(201).json(populatedPost);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.getPostDetail = async (req, res) => {
  try {
    const post = await postService.getPostDetail(req.params.id);
    res.status(200).json(post);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.toggleLikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userId;

    const result = await postService.toggleLikePost(userId, postId);

    res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.unlikePost = async (req, res) => {
  try {
    await postService.unlikePost(req.user.userId, req.params.id);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const result = await postService.getComments(postId);

    res.status(200).json({
      success: true,
      comments: result.comments,
      total: result.total,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.params;
    const { content } = req.body;

    const newComment = await postService.addComment(userId, postId, content);

    res.status(201).json(newComment);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};
