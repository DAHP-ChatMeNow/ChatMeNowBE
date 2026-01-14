const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

exports.getConversations = async (req, res) => {
  const userId = req.user.userId;

  const conversations = await Conversation.find({
    "members.userId": userId
  })
  .sort({ updatedAt: -1 })
  .populate("members.userId", "displayName avatar isOnline")
  .populate("lastMessage.senderId", "displayName avatar");

  res.json({
    success: true,
    conversations
  });
};



exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 20, beforeId } = req.query; 

    const query = { conversationId };
    
    
    if (beforeId) {
        const referenceMsg = await Message.findById(beforeId);
        if (referenceMsg) {
            query.createdAt = { $lt: referenceMsg.createdAt };
        }
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) 
      .limit(parseInt(limit))
      .populate("senderId", "displayName avatar");

    const ordered = messages.reverse();
    res.status(200).json({
      success: true,
      messages: ordered,
      total: ordered.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  const senderId = req.user.userId;
  const { conversationId, content, type = "text" } = req.body;

  const message = await Message.create({
    conversationId,
    senderId,
    content,
    type
  });

  await message.populate("senderId", "displayName avatar");

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: {
      content: type === "image" ? "Đã gửi một ảnh" : content,
      senderId,
      senderName: message.senderId.displayName,
      type,
      createdAt: message.createdAt
    },
    updatedAt: new Date()
  });

  res.status(201).json(message);
};


exports.createGroupConversation = async (req, res) => {
  const userId = req.user.userId;
  const { name, memberIds, groupAvatar } = req.body;

  if (!name || memberIds.length < 2) {
    return res.status(400).json({
      message: "Group phải có ít nhất 3 người"
    });
  }

  const members = [
    { userId, role: "admin" },
    ...memberIds.map(id => ({ userId: id }))
  ];

  const group = await Conversation.create({
    type: "group",
    name,
    groupAvatar,
    members
  });

  res.status(201).json({ success: true, group });
};


exports.getConversationDetails = async (req, res) => {
    try {
        const conv = await Conversation.findById(req.params.id)
            .populate("members.userId", "displayName avatar isOnline");
        
        if (!conv) {
            return res.status(404).json({ message: "Kh\u00f4ng t\u00ecm th\u1ea5y cu\u1ed9c tr\u00f2 chuy\u1ec7n" });
        }
        
        console.log("getConversationDetails:", conv);
        res.status(200).json({ success: true, conversation: conv });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getOrCreatePrivateConversation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { partnerId } = req.params;

    let conversation = await Conversation.findOne({
      type: "private",
      $and: [
        { members: { $elemMatch: { userId } } },
        { members: { $elemMatch: { userId: partnerId } } }
      ]
    }).select("_id type members lastMessage updatedAt");

    if (!conversation) {
      conversation = await Conversation.create({
        type: "private",
        members: [
          { userId },
          { userId: partnerId }
        ]
      });
    }

    res.status(conversation.isNew ? 201 : 200).json({
      success: true,
      conversation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPrivateConversationPartner = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    if (conversation.type !== "private") {
      return res.status(400).json({ message: "Chỉ áp dụng cho cuộc trò chuyện riêng tư" });
    }

    // Tìm partner (userId khác với current user)
    const partnerMember = conversation.members.find(
      member => member.userId.toString() !== userId
    );

    if (!partnerMember) {
      return res.status(404).json({ message: "Không tìm thấy đối tác" });
    }

    // Lấy thông tin partner
    const partner = await User.findById(partnerMember.userId)
      .select("displayName avatar isOnline lastSeen");

    if (!partner) {
      return res.status(404).json({ message: "Không tìm thấy thông tin người dùng" });
    }

    res.status(200).json({
      success: true,
      partner: {
        _id: partner._id,
        displayName: partner.displayName,
        avatar: partner.avatar,
        isOnline: partner.isOnline,
        lastSeen: partner.lastSeen
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
