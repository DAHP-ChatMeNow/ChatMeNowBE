const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ConversationSchema = new Schema({
  type: { type: String, enum: ["private", "group"], default: "private" },
  
  
  name: { type: String }, 
  groupAvatar: { type: String },
  adminId: { type: Schema.Types.ObjectId, ref: "User" },

  members: [{
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    joinedAt: { type: Date, default: Date.now },
    role: { type: String, enum: ["member", "admin"], default: "member" },
    lastReadAt: { type: Date } 
  }],

  
  lastMessage: {
    content: String,
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    senderName: String,
    type: String,
    createdAt: Date
  }
}, { timestamps: true });


ConversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model("Conversation", ConversationSchema);