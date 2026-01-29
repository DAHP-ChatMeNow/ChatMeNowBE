const {
  formatBufferToDataURI,
  uploadToCloudinary,
} = require("../middleware/storage");
const cloudinary = require("../../config/cloudinary");
const User = require("../models/user.model");
const Conversation = require("../models/conversation.model");

const handleUpload = async (req) => {
  if (!req.file) {
    throw new Error("Không tìm thấy file ảnh");
  }
  const fileDataUri = formatBufferToDataURI(req.file);
  const uploadResult = await uploadToCloudinary(fileDataUri.content);
  return uploadResult.secure_url;
};

const uploadAvatar = async (req, res) => {
  try {
    const cloudinaryUrl = await handleUpload(req);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { avatar: cloudinaryUrl },
      { new: true },
    ).select("-accountId");

    res.status(200).json(updatedUser);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Lỗi server khi upload avatar", error: err.message });
  }
};

const uploadPhoto = async (req, res) => {
  try {
    const cloudinaryUrl = await handleUpload(req);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { coverImage: cloudinaryUrl },
      { new: true },
    ).select("-accountId");

    res.status(200).json(updatedUser);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Lỗi server khi thêm ảnh", error: err.message });
  }
};

const deletePhoto = async (req, res) => {
  const { type } = req.body; // "avatar" or "coverImage"

  if (!type || !["avatar", "coverImage"].includes(type)) {
    return res
      .status(400)
      .json({ msg: "Vui lòng cung cấp type: avatar hoặc coverImage" });
  }

  try {
    const user = await User.findById(req.user.userId);
    const photoUrl = user[type];

    if (!photoUrl) {
      return res.status(400).json({ msg: "Không có ảnh để xóa" });
    }

    const publicIdWithFormat = photoUrl.split("/").slice(-1).join("/");
    const publicId = publicIdWithFormat.split(".")[0];

    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { [type]: "" },
      { new: true },
    ).select("-accountId");

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ msg: "Lỗi server khi xóa ảnh", error: err.message });
  }
};

const uploadGroupAvatar = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    // Kiểm tra conversation tồn tại và là group
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ msg: "Không tìm thấy nhóm" });
    }

    if (conversation.type !== "group") {
      return res.status(400).json({ msg: "Chỉ nhóm mới có ảnh đại diện" });
    }

    // Kiểm tra user có phải admin không
    const member = conversation.members.find(
      (m) => m.userId.toString() === userId,
    );
    if (!member || member.role !== "admin") {
      return res.status(403).json({ msg: "Chỉ admin mới có thể đổi ảnh nhóm" });
    }

    const cloudinaryUrl = await handleUpload(req);

    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { groupAvatar: cloudinaryUrl },
      { new: true },
    ).populate("members.userId", "displayName avatar");

    res.status(200).json(updatedConversation);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Lỗi server khi upload ảnh nhóm", error: err.message });
  }
};

module.exports = {
  uploadAvatar,
  uploadPhoto,
  deletePhoto,
  uploadGroupAvatar,
};
