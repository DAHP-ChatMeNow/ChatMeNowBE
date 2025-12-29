const { Server } = require("socket.io");
const Message = require("../api/models/Message");
const Conversation = require("../api/models/Conversation");
const User = require("../api/models/User");
const Notification = require("../api/models/Notification"); 

function initializeSocket(io) {


  io.on("connection", (socket) => {
    
    
    
    socket.on("setup", (userId) => {
      socket.join(userId); 
      console.log(`👤 User ${userId} đã online và vào phòng riêng`);
      socket.emit("connected");
    });

    
    socket.on("joinRoom", ({ conversationId }) => {
      socket.join(conversationId);
    });

    
    socket.on("sendMessage", async (data) => {
      try {
        const { conversationId, text, senderId, type = "text", receiverId } = data; 

        
        const sender = await User.findById(senderId).select("displayName avatar");
        const newMessage = new Message({
          conversationId, senderId, content: text, type
        });
        let savedMessage = await newMessage.save();
        savedMessage = await savedMessage.populate("senderId", "displayName avatar");

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: {
            content: type === "image" ? "Đã gửi một ảnh" : text,
            senderId, senderName: sender.displayName, type, createdAt: new Date()
          },
          updatedAt: new Date()
        });

        
        io.to(conversationId).emit("newMessage", savedMessage);

        
        
        
        
        
        const newNoti = await Notification.create({
            recipientId: receiverId,
            senderId: senderId,
            type: "message", 
            referenceId: conversationId,
            message: `đã gửi tin nhắn: ${text.substring(0, 30)}...`, 
            isRead: false
        });
        
        
        
        io.to(receiverId).emit("notification", {
            type: "message",
            senderName: sender.displayName,
            senderAvatar: sender.avatar,
            content: text,
            conversationId: conversationId,
            createdAt: new Date()
        });

      } catch (error) {
        console.error("Lỗi socket:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Client ngắt kết nối");
    });
  });
}

module.exports = initializeSocket;