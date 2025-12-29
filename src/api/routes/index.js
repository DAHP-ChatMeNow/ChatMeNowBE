const express = require("express");
const router = express.Router();

const authRoute = require("./auth.route");
const userRoute = require("./user.route");
const postRoute = require("./post.route");
const chatRoute = require("./chat.route");
const notiRoute = require("./notification.route");

router.use("/auth", authRoute);
router.use("/users", userRoute);
router.use("/posts", postRoute);
router.use("/chat", chatRoute);
router.use("/notifications", notiRoute);

module.exports = router;