// Export tất cả constants từ các module con
// Có thể import theo 2 cách:
// 1. Import all: const { CONVERSATION_TYPES, POST_PRIVACY } = require('../../constants');
// 2. Import specific module: const { CONVERSATION_TYPES } = require('../../constants/conversation.constants');

const {
  CONVERSATION_TYPES,
  MEMBER_ROLES,
} = require("./conversation.constants");
const { FRIEND_REQUEST_STATUS } = require("./friend-request.constants");
const { POST_PRIVACY } = require("./post.constants");
const { MESSAGE_TYPES } = require("./message.constants");
const { NOTIFICATION_TYPES } = require("./notification.constants");
const { TRANSACTION_STATUS } = require("./transaction.constants");
const { USER_ROLES } = require("./user.constants");

module.exports = {
  CONVERSATION_TYPES,
  MEMBER_ROLES,
  FRIEND_REQUEST_STATUS,
  POST_PRIVACY,
  MESSAGE_TYPES,
  NOTIFICATION_TYPES,
  TRANSACTION_STATUS,
  USER_ROLES,
};
