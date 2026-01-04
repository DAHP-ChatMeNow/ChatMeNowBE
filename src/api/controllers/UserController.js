const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");
const Notification = require("../models/Notification");


exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query; 
    if (!q) return res.status(400).json({ message: "Vui lòng nhập từ khóa" });

    
    const users = await User.find({
      displayName: { $regex: q, $options: "i" },
      _id: { $ne: req.user.userId }
    })
    .select("displayName avatar bio") 
    .limit(10);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("friends", "displayName avatar"); 
    
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.updateProfile = async (req, res) => {
  try {
    const { displayName, bio, language, themeColor } = req.body;
    
    if (displayName && displayName.trim().length < 2) {
      return res.status(400).json({ message: "Tên hiển thị phải có ít nhất 2 ký tự" });
    }

    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName.trim();
    if (bio !== undefined) updateData.bio = bio;
    if (language !== undefined) updateData.language = language;
    if (themeColor !== undefined) updateData.themeColor = themeColor;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-__v");

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công",
      user: updatedUser
    });
  } catch (error) {
    console.log("❌ Lỗi cập nhật profile:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ message: "Vui lòng cung cấp URL avatar" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { avatar },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật avatar thành công",
      user: updatedUser
    });
  } catch (error) {
    console.log("❌ Lỗi cập nhật avatar:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

exports.updateCoverImage = async (req, res) => {
  try {
    const { coverImage } = req.body;

    if (!coverImage) {
      return res.status(400).json({ message: "Vui lòng cung cấp URL ảnh bìa" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { coverImage },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật ảnh bìa thành công",
      user: updatedUser
    });
  } catch (error) {
    console.log("❌ Lỗi cập nhật ảnh bìa:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};




exports.getContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate("friends", "displayName avatar bio isOnline lastSeen");
    
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.status(200).json({ contacts: user.friends });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const receiverId = req.params.userId || req.body.receiverId;

    if (senderId === receiverId) return res.status(400).json({ message: "Không thể kết bạn với chính mình" });

    
    const existingRequest = await FriendRequest.findOne({
      senderId,
      receiverId,
      status: "pending"
    });

    if (existingRequest) return res.status(400).json({ message: "Đã gửi lời mời trước đó" });

    
    const newRequest = await FriendRequest.create({ senderId, receiverId });

    
    await Notification.create({
      recipientId: receiverId,
      senderId: senderId,
      type: "friend_request",
      referenceId: newRequest._id,
      message: "đã gửi cho bạn lời mời kết bạn."
    });

    res.status(201).json({ message: "Đã gửi lời mời", request: newRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.respondFriendRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;
    const { status } = req.body; 

    const request = await FriendRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Lời mời không tồn tại" });

    
    if (request.receiverId.toString() !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền xử lý lời mời này" });
    }

    
    request.status = status;
    await request.save();

    if (status === "accepted") {
      
      const senderId = request.senderId;

      await Promise.all([
        User.findByIdAndUpdate(userId, { $addToSet: { friends: senderId } }), 
        User.findByIdAndUpdate(senderId, { $addToSet: { friends: userId } }),
        
        
        Notification.create({
          recipientId: senderId,
          senderId: userId,
          type: "system",
          message: "đã chấp nhận lời mời kết bạn."
        })
      ]);
    }

    res.status(200).json({ message: `Đã ${status} lời mời` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingRequests = async (req, res) => {
    try {
        const requests = await FriendRequest.find({
            receiverId: req.user.userId,
            status: "pending"
        }).populate("senderId", "displayName avatar"); 

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;

    const request = await FriendRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Lời mời không tồn tại" });

    if (request.receiverId.toString() !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền xử lý lời mời này" });
    }

    request.status = "accepted";
    await request.save();

    const senderId = request.senderId;

    await Promise.all([
      User.findByIdAndUpdate(userId, { $addToSet: { friends: senderId } }),
      User.findByIdAndUpdate(senderId, { $addToSet: { friends: userId } }),
      Notification.create({
        recipientId: senderId,
        senderId: userId,
        type: "system",
        message: "đã chấp nhận lời mời kết bạn."
      })
    ]);

    res.status(200).json({ success: true, message: "Đã chấp nhận lời mời kết bạn" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;

    const request = await FriendRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Lời mời không tồn tại" });

    if (request.receiverId.toString() !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền xử lý lời mời này" });
    }

    request.status = "rejected";
    await request.save();

    res.status(200).json({ success: true, message: "Đã từ chối lời mời kết bạn" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeFriend = async (req, res) => {
  try {
    const userId = req.user.userId;
    const friendId = req.params.userId;

    if (userId === friendId) {
      return res.status(400).json({ message: "Không thể xóa chính mình" });
    }

    await Promise.all([
      User.findByIdAndUpdate(userId, { $pull: { friends: friendId } }),
      User.findByIdAndUpdate(friendId, { $pull: { friends: userId } }),
      FriendRequest.deleteMany({
        $or: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId }
        ]
      })
    ]);

    res.status(200).json({ success: true, message: "Đã xóa bạn bè" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}