const express = require("express");
const router = express.Router();
const conversationController = require("../controller/conversation.controller");

// Create a new Conversation
router.post("/create-chat", conversationController.createConversation);

router.get(
  "/get-chats/:user_id",
  conversationController.getConversationByUserId
);

router.get(
  "/get-messages/:chat_id",
  conversationController.getConversationById
);

// Send a message
router.post("/messages", conversationController.createMessage);

// router.post("/chatwoot/listener", conversationController.chatwootListener);

router.get("/temp/get/headers", conversationController.logHeaders);

module.exports = router;
