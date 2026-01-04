const Account = require("../models/Account");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


const generateToken = (accountId, userId) => {
  return jwt.sign({ accountId, userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

exports.register = async (req, res) => {
  try {
    const { displayName, email, password } = req.body;

    if (!displayName || !email || !password) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin (displayName, email, password)" });
    }

    
    const existingAccount = await Account.findOne({ email });
    if (existingAccount) {
      return res.status(400).json({ message: "Email này đã được sử dụng." });
    }

    
    
    const newAccount = await Account.create({
      email,
      password,
      role: "user"
    });

    
    const newUser = await User.create({
      accountId: newAccount._id,
      displayName: displayName,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`
    });

    
    const token = generateToken(newAccount._id, newUser._id);

    res.status(201).json({
      success: true,
      token,
      user: newUser
    });

  } catch (error) {
    console.log("❌ LỖI CHI TIẾT:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      const message = field 
        ? `Dữ liệu '${field}' đã tồn tại trong hệ thống.`
        : "Dữ liệu đã tồn tại trong hệ thống.";
      
      return res.status(409).json({ 
        message,
        detail: error.message 
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    
    const account = await Account.findOne({ email });
    if (!account) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng." });
    }

    
    const isMatch = await account.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng." });
    }

    
    const user = await User.findOne({ accountId: account._id });

    
    const token = generateToken(account._id, user._id);

    res.status(200).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    
    const user = await User.findById(req.user.userId).populate("accountId", "email role isPremium");
    if (!user) {
        return res.status(404).json({ message: "Không tìm thấy user" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
    
    res.status(200).json({ message: "Tính năng đang phát triển" });
};