const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  
  content: { type: String },
  type: { type: String, enum: ["text", "image", "video", "file", "system"], default: "text" },
  
  attachments: [{
    url: String,
    fileType: String,
    fileName: String,
    fileSize: Number
  }],

  replyToMessageId: { type: Schema.Types.ObjectId, ref: "Message", default: null },
  
  readBy: [{ type: Schema.Types.ObjectId, ref: "User" }], 
  isUnsent: { type: Boolean, default: false }, 

}, { timestamps: true });


MessageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model("Message", MessageSchema);