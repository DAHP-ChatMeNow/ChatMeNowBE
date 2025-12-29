const User = require("../../model/User");
const {
  formatBufferToDataURI,
  uploadToCloudinary,
} = require("../middleware/storage");
const cloudinary = require("../../config/cloudinary");

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
      req.user.id,
      { $set: { "profile.photos.0": cloudinaryUrl } },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Lỗi server khi upload avatar", error: err.message });
  }
};

const uploadPhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.profile.photos.length >= 6) {
      return res
        .status(400)
        .json({ msg: "Bạn đã đạt số lượng ảnh tối đa (6)" });
    }

    const cloudinaryUrl = await handleUpload(req);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { "profile.photos": cloudinaryUrl } },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Lỗi server khi thêm ảnh", error: err.message });
  }
};

const deletePhoto = async (req, res) => {
  const { photoUrl } = req.body;
  if (!photoUrl) {
    return res.status(400).json({ msg: "Vui lòng cung cấp URL ảnh" });
  }

  try {
    const publicIdWithFormat = photoUrl.split("/").slice(-1).join("/");
    const publicId = publicIdWithFormat.split(".")[0];

    if (publicId) {
      console.log("Đang xóa trên Cloudinary, ID:", publicId);
      await cloudinary.uploader.destroy(publicId);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { "profile.photos": photoUrl } },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ msg: "Lỗi server khi xóa ảnh", error: err.message });
  }
};

module.exports = {
  uploadAvatar,
  uploadPhoto,
  deletePhoto,
};
