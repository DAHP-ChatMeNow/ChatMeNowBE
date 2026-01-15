const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");
const Notification = require("../models/Notification");
const Account = require("../models/Account");
const Conversation = require("../models/Conversation");

exports.searchUsers = async (req, res) => {
  try {
    const { q, query } = req.query;
    const keyword = (q ?? query ?? "").trim();

    if (!keyword) {
      return res.status(400).json({ message: "Vui lòng nhập từ khóa tìm kiếm" });
    }

    // 1️⃣ Tìm account theo email / phone
    const accountsByContact = await Account.find({
      $or: [
        { phoneNumber: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } }
      ]
    }).select("_id");

    const accountIds = accountsByContact.map(acc => acc._id);

    // 2️⃣ Tìm user
    const users = await User.find({
      $or: [
        { displayName: { $regex: keyword, $options: "i" } },
        { accountId: { $in: accountIds } }
      ],
      _id: { $ne: req.user.userId }
    })
      .populate("accountId", "phoneNumber email")
      .select("displayName avatar bio accountId")
      .limit(20);

    // 3️⃣ Lấy currentUser 1 lần
    const currentUser = await User.findById(req.user.userId).select("friends");

    // 4️⃣ Gắn trạng thái bạn bè
    const usersWithFriendStatus = await Promise.all(
      users.map(async (user) => {
        const isFriend = currentUser.friends.includes(user._id);

        const pendingRequest = await FriendRequest.findOne({
          $or: [
            { sender: req.user.userId, receiver: user._id, status: "pending" },
            { sender: user._id, receiver: req.user.userId, status: "pending" }
          ]
        });

        return {
          _id: user._id,
          displayName: user.displayName,
          avatar: user.avatar,
          bio: user.bio,
          phoneNumber: user.accountId?.phoneNumber || "",
          email: user.accountId?.email || "",
          isFriend,
          hasPendingRequest: !!pendingRequest,
          requestSentByMe: pendingRequest?.sender?.toString() === req.user.userId
        };
      })
    );

    // ✅ 5️⃣ RESPONSE CHUẨN
    res.status(200).json({
      success: true,
      users: usersWithFriendStatus,
      total: usersWithFriendStatus.length
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate ObjectId format
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "User ID không hợp lệ" });
    }

    const user = await User.findById(userId)
      .populate("friends", "displayName avatar")
      .select("-__v"); // Loại bỏ __v field
    
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Response với format chuẩn
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        coverImage: user.coverImage,
        friends: user.friends,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("❌ Lỗi getUserProfile:", error);
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
     const { userId } = req.params;
    const user = await User.findById(userId)
      .populate("friends", "displayName avatar bio isOnline lastSeen");
    
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.status(200).json({ 
      success: true,
      friends: user.friends,
      total: user.friends.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const receiverId = req.params.userId || req.body.receiverId;

    if (senderId === receiverId) return res.status(400).json({ message: "Không thể kết bạn với chính mình" });

    // Kiểm tra xem người nhận có tồn tại không
    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: "Người dùng không tồn tại" });

    // Kiểm tra xem đã là bạn bè chưa
    const sender = await User.findById(senderId);
    if (sender.friends.includes(receiverId)) {
      return res.status(400).json({ message: "Đã là bạn bè rồi" });
    }

    // Kiểm tra xem đã có lời mời pending chưa
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { senderId, receiverId, status: "pending" },
        { senderId: receiverId, receiverId: senderId, status: "pending" }
      ]
    });

    if (existingRequest) {
      if (existingRequest.senderId.toString() === senderId) {
        return res.status(400).json({ message: "Đã gửi lời mời trước đó" });
      } else {
        return res.status(400).json({ message: "Người này đã gửi lời mời kết bạn cho bạn" });
      }
    }

    
    const newRequest = await FriendRequest.create({ senderId, receiverId });

    
    await Notification.create({
      recipientId: receiverId,
      senderId: senderId,
      type: "friend_request",
      referenced: newRequest._id,
      message: "đã gửi cho bạn lời mời kết bạn."
    });

    res.status(201).json({ 
      success: true,
      message: "Đã gửi lời mời kết bạn", 
      request: newRequest 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// API tìm kiếm và gửi lời mời kết bạn thông qua email, SĐT hoặc tên
exports.searchAndAddFriend = async (req, res) => {
  try {
    const { searchQuery } = req.body;
    const senderId = req.user.userId;

    if (!searchQuery) {
      return res.status(400).json({ message: "Vui lòng nhập email, số điện thoại hoặc tên người dùng" });
    }

    // Tìm kiếm theo email hoặc số điện thoại trong Account
    const accountsByContact = await Account.find({
      $or: [
        { email: searchQuery.toLowerCase().trim() },
        { phoneNumber: searchQuery.trim() }
      ]
    }).select("_id");

    const accountIds = accountsByContact.map(acc => acc._id);

    // Tìm kiếm người dùng theo tên chính xác hoặc theo accountId
    const users = await User.find({
      $or: [
        { displayName: { $regex: `^${searchQuery.trim()}$`, $options: "i" } },
        { accountId: { $in: accountIds } }
      ],
      _id: { $ne: senderId }
    })
    .populate("accountId", "phoneNumber email")
    .select("displayName avatar bio accountId");

    if (users.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Nếu tìm thấy nhiều kết quả, trả về danh sách để người dùng chọn
    if (users.length > 1) {
      const usersWithStatus = await Promise.all(
        users.map(async (user) => {
          const sender = await User.findById(senderId);
          const isFriend = sender.friends.includes(user._id);
          
          const pendingRequest = await FriendRequest.findOne({
            $or: [
              { senderId, receiverId: user._id, status: "pending" },
              { senderId: user._id, receiverId: senderId, status: "pending" }
            ]
          });

          return {
            _id: user._id,
            displayName: user.displayName,
            avatar: user.avatar,
            bio: user.bio,
            phoneNumber: user.accountId?.phoneNumber || "",
            email: user.accountId?.email || "",
            isFriend,
            hasPendingRequest: !!pendingRequest
          };
        })
      );

      return res.status(200).json({
        success: true,
        message: "Tìm thấy nhiều kết quả",
        multiple: true,
        users: usersWithStatus,
        total: usersWithStatus.length
      });
    }

    // Nếu chỉ có 1 kết quả, tự động gửi lời mời kết bạn
    const receiverId = users[0]._id;

    // Kiểm tra đã là bạn bè chưa
    const sender = await User.findById(senderId);
    if (sender.friends.includes(receiverId)) {
      return res.status(400).json({ 
        message: "Đã là bạn bè rồi",
        user: {
          _id: users[0]._id,
          displayName: users[0].displayName,
          avatar: users[0].avatar
        }
      });
    }

    // Kiểm tra lời mời pending
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { senderId, receiverId, status: "pending" },
        { senderId: receiverId, receiverId: senderId, status: "pending" }
      ]
    });

    if (existingRequest) {
      if (existingRequest.senderId.toString() === senderId) {
        return res.status(400).json({ 
          message: "Đã gửi lời mời cho người này trước đó",
          user: {
            _id: users[0]._id,
            displayName: users[0].displayName,
            avatar: users[0].avatar
          }
        });
      } else {
        return res.status(400).json({ 
          message: "Người này đã gửi lời mời kết bạn cho bạn. Vui lòng kiểm tra lời mời kết bạn",
          user: {
            _id: users[0]._id,
            displayName: users[0].displayName,
            avatar: users[0].avatar
          }
        });
      }
    }

    // Tạo lời mời kết bạn mới
    const newRequest = await FriendRequest.create({ senderId, receiverId });

    // Tạo thông báo
    await Notification.create({
      recipientId: receiverId,
      senderId: senderId,
      type: "friend_request",
      referenced: newRequest._id,
      message: "đã gửi cho bạn lời mời kết bạn."
    });

    res.status(201).json({ 
      success: true,
      message: "Đã tìm thấy và gửi lời mời kết bạn thành công",
      user: {
        _id: users[0]._id,
        displayName: users[0].displayName,
        avatar: users[0].avatar,
        phoneNumber: users[0].accountId?.phoneNumber || "",
        email: users[0].accountId?.email || ""
      },
      request: newRequest
    });
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

      // Tạo conversation nếu chưa tồn tại
      const existingConv = await Conversation.findOne({
        type: "private",
        "members.userId": { $all: [userId, senderId] }
      });

      const conversationPromise = existingConv 
        ? Promise.resolve(existingConv)
        : (async () => {
            // Lấy thông tin của sender để gán làm groupAvatar và name
            const senderUser = await User.findById(senderId).select("displayName avatar");
            return Conversation.create({
              type: "private",
              name: senderUser.displayName,
              groupAvatar: senderUser.avatar,
              members: [
                { userId, role: "member" },
                { userId: senderId, role: "member" }
              ]
            });
          })();

      await Promise.all([
        User.findByIdAndUpdate(userId, { $addToSet: { friends: senderId } }), 
        User.findByIdAndUpdate(senderId, { $addToSet: { friends: userId } }),
        
        
        Notification.create({
          recipientId: senderId,
          senderId: userId,
          type: "system",
          message: "đã chấp nhận lời mời kết bạn."
        }),
        conversationPromise
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

        res.status(200).json({
          success: true,
          requests: requests,
          total: requests.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;

    const request = await FriendRequest.findById(requestId);
    if (!request)
      return res.status(404).json({ message: "Lời mời không tồn tại" });

    if (request.receiverId.toString() !== userId)
      return res.status(403).json({ message: "Không có quyền xử lý" });

    if (request.status === "accepted")
      return res.status(400).json({ message: "Lời mời đã được chấp nhận" });

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

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
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

    // Xóa quan hệ bạn bè + lời mời kết bạn
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

    // Tìm các cuộc trò chuyện riêng tư giữa 2 người và xóa kèm tin nhắn
    const privateConversations = await Conversation.find({
      type: "private",
      "members.userId": { $all: [userId, friendId] }
    }).select("_id");

    if (privateConversations.length > 0) {
      const convIds = privateConversations.map(c => c._id);
      const Message = require("../models/Message");
      await Promise.all([
        Message.deleteMany({ conversationId: { $in: convIds } }),
        Conversation.deleteMany({ _id: { $in: convIds } })
      ]);
    }

    res.status(200).json({ success: true, message: "Đã xóa bạn bè và hội thoại riêng tư" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy thông tin email và số điện thoại từ accountId của user
exports.getUserEmail = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("🔍 Lấy email và SĐT cho userId:", userId);
    const user = await User.findById(userId)
      .populate("accountId", "email phoneNumber")
      .select("accountId displayName");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (!user.accountId) {
      return res.status(404).json({ message: "Không tìm thấy thông tin tài khoản" });
    }

    res.status(200).json({
      success: true,
      email: user.accountId.email || "",
      phoneNumber: user.accountId.phoneNumber || "",
      displayName: user.displayName
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy email của user cụ thể theo userId
exports.getUserEmailById = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("🔍 Lấy email cho userId:", userId);
    const user = await User.findById(userId)
      .populate("accountId", "email phoneNumber")
      .select("accountId displayName avatar");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (!user.accountId) {
      return res.status(404).json({ message: "Không tìm thấy thông tin tài khoản" });
    }

    res.status(200).json({
      success: true,
      _id: user._id,
      displayName: user.displayName,
      avatar: user.avatar,
      email: user.accountId.email || "",
      phoneNumber: user.accountId.phoneNumber || ""
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};