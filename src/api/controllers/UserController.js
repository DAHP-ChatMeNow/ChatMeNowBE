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
    const { displayName, bio, avatar, coverImage } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { displayName, bio, avatar, coverImage },
      { new: true } 
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




exports.sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiverId } = req.body;

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
}