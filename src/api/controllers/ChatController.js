const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");


exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;

    
    const conversations = await Conversation.find({
      "members.userId": userId
    })
    .sort({ updatedAt: -1 }) 
    .populate("members.userId", "displayName avatar isOnline"); 

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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

    
    res.status(200).json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { conversationId, content, type = "text" } = req.body;
    
    
    const newMessage = await Message.create({
      conversationId,
      senderId,
      content,
      type
    });

    
    await newMessage.populate("senderId", "displayName avatar");

    
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        content: type === "image" ? "Đã gửi một ảnh" : content,
        senderId: senderId,
        senderName: newMessage.senderId.displayName,
        type: type,
        createdAt: new Date()
      }
    });

    
    

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.createConversation = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiverId } = req.body; 

    
    
    const existingConv = await Conversation.findOne({
      type: "private",
      "members.userId": { $all: [senderId, receiverId] } 
    });

    if (existingConv) {
      return res.status(200).json(existingConv); 
    }

    
    const newConv = await Conversation.create({
      type: "private",
      members: [
        { userId: senderId, role: "member" },
        { userId: receiverId, role: "member" }
      ],
      updatedAt: new Date()
    });

    res.status(201).json(newConv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getConversationDetails = async (req, res) => {
    try {
        const conv = await Conversation.findById(req.params.id)
            .populate("members.userId", "displayName avatar isOnline");
        res.status(200).json(conv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};