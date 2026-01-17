const userService = require("../service/user.service");

exports.searchUsers = async (req, res) => {
  try {
    const { q, query } = req.query;
    const keyword = (q ?? query ?? "").trim();

    const result = await userService.searchUsers(keyword, req.user.userId);

    res.status(200).json({
      success: true,
      users: result.users,
      total: result.total,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await userService.getUserProfile(req.params.userId);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updatedUser = await userService.updateProfile(
      req.user.userId,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công",
      user: updatedUser,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    const updatedUser = await userService.updateAvatar(
      req.user.userId,
      req.body.avatar,
    );

    res.status(200).json({
      success: true,
      message: "Cập nhật avatar thành công",
      user: updatedUser,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

exports.updateCoverImage = async (req, res) => {
  try {
    const updatedUser = await userService.updateCoverImage(
      req.user.userId,
      req.body.coverImage,
    );

    res.status(200).json({
      success: true,
      message: "Cập nhật ảnh bìa thành công",
      user: updatedUser,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

exports.getContacts = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await userService.getContacts(userId);

    res.status(200).json({
      success: true,
      friends: result.friends,
      total: result.total,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const receiverId = req.params.userId || req.body.receiverId;

    const newRequest = await userService.sendFriendRequest(
      senderId,
      receiverId,
    );

    res.status(201).json({
      success: true,
      message: "Đã gửi lời mời kết bạn",
      request: newRequest,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// API tìm kiếm và gửi lời mời kết bạn thông qua email, SĐT hoặc tên
exports.searchAndAddFriend = async (req, res) => {
  try {
    const { searchQuery } = req.body;
    const senderId = req.user.userId;

    const result = await userService.searchAndAddFriend(senderId, searchQuery);

    if (result.multiple) {
      return res.status(200).json({
        success: true,
        message: "Tìm thấy nhiều kết quả",
        multiple: true,
        users: result.users,
        total: result.total,
      });
    }

    res.status(201).json({
      success: true,
      message: "Đã tìm thấy và gửi lời mời kết bạn thành công",
      user: result.user,
      request: result.request,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
        user: error.user,
      });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.respondFriendRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;
    const { status } = req.body;

    await userService.respondFriendRequest(userId, requestId, status);

    res.status(200).json({ message: `Đã ${status} lời mời` });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const result = await userService.getPendingRequests(req.user.userId);

    res.status(200).json({
      success: true,
      requests: result.requests,
      total: result.total,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};
exports.acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;

    await userService.acceptFriendRequest(userId, requestId);

    res.json({ success: true });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;

    await userService.rejectFriendRequest(userId, requestId);

    res
      .status(200)
      .json({ success: true, message: "Đã từ chối lời mời kết bạn" });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.removeFriend = async (req, res) => {
  try {
    const userId = req.user.userId;
    const friendId = req.params.userId;

    await userService.removeFriend(userId, friendId);

    res
      .status(200)
      .json({ success: true, message: "Đã xóa bạn bè và hội thoại riêng tư" });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Lấy thông tin email và số điện thoại từ accountId của user
exports.getUserEmail = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await userService.getUserEmail(userId);

    res.status(200).json({
      success: true,
      email: result.email,
      phoneNumber: result.phoneNumber,
      displayName: result.displayName,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Lấy email của user cụ thể theo userId
exports.getUserEmailById = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await userService.getUserEmailById(userId);

    res.status(200).json({
      success: true,
      _id: result._id,
      displayName: result.displayName,
      avatar: result.avatar,
      email: result.email,
      phoneNumber: result.phoneNumber,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};
