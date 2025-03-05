const Conversation = require("../models/conversations");
const { formatMessages } = require("../helpers/format-conversations");
const users = require("../models/user");
const SourceInboxMap = require("../models/source-inbox-map");
const { createUser } = require("./user.controller");
const { createConversation, sendChatMessage } = require("../helpers/chatwoot-helper");
const wsService = require("../socket/socket.service");

exports.createConversation = async (req, res) => {
  try {
    const { category, description } = req.body;

    const { name, email, userID } = req.user;

    if (!name || !email || !category || !description)
      return res.status(400).json({
        error: "Missing required fields - user_id, category, description",
      });

    let existingUser = await users.findOne({
      email
    })

    let sourceInboxMap = await SourceInboxMap.findOne({
      inboxId: category,
      userId: userID
    });

    if (!existingUser || !sourceInboxMap) {
      const { user:newUser, sourceInboxMap: sourceMap } = await createUser(
        email, name, category, req.user
      )
      existingUser = newUser;
      sourceInboxMap = sourceMap;
    }

    const existingConversation = await Conversation.findOne({
      user: existingUser._id,
      category,
      description,
    });
    

    if (existingConversation) {
      if (existingConversation.status === "closed") {
        existingConversation.status = "open";
        await existingConversation.save();
        return res.status(200).json(existingConversation);
      }
      return res.status(200).json(existingConversation);
    }

    const chatwootConversation = (await createConversation(category, sourceInboxMap.sourceId, req.user)).data;

    if (!chatwootConversation) {
      return res.status(500).json({ error: "Failed to create conversation in chatwoot" });
    }

    const chatwootMessage = (await sendChatMessage(category, sourceInboxMap.sourceId, chatwootConversation.id, description, req.user)).data; 

    if (!chatwootMessage) {
      return res.status(500).json({ error: "Failed to send message" });
    }

    const conversation = new Conversation({
      conversationId: chatwootConversation.id,
      category,
      description,
      status: "open",
      user: existingUser._id,
      contact_identifier: existingUser.sourceId,
      chatwoot_data: {
        id: chatwootConversation.id,
        inbox_id: chatwootConversation.inbox_id,
        uuid: chatwootConversation.uuid,
        status: chatwootConversation.status,
      },
      messages: [{
        type: "incoming",
        message: description,
        timestamp: new Date(),
        messageId: chatwootMessage.id,
      }],
    });

    await conversation.save();

    res.status(201).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
};

exports.getConversationByUserId = async (req, res) => {
  try {
    if (!req.user.email) {
      return res.status(400).json({ error: "Missing required fields - user_id" });
    }
        
    const user = await users.findOne({
      email: req.user.email,
    });

    if (!user) {
      return res.status(200).json([]);
    }

    const conversations = await Conversation.find({
      user: user._id,
    }).sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve conversations", stack: error });
  }
};

exports.getConversationById = async (req, res) => {
  try {

    const user = await users.findOne({
      email: req.user.email,
    })

    const conversation = await Conversation.findOne({
      _id: req.params.chat_id,
      user: user._id,
    }).sort({
      updatedAt: -1,
    });

    if (!conversation)
      return res.status(404).json({ error: "Conversation not found" });
    const messages = formatMessages(conversation.messages);
    res.status(200).json({ ...conversation.toJSON(), count: conversation.messages.length, messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve conversation" });
  }
};

exports.createMessage = async (req, res) => {
  try {
    const { conversation_id, message, sender } = req.body;
    const { userID } = req.user;  

    if (!conversation_id || !message) {
      return res
        .status(400)
        .json({ error: "conversation_id and message are required" });
    }

    const user = await users.findOne({
      email: req.user.email,
    });

    const conversation = await Conversation.findOne({
      _id: conversation_id,
      user: user._id,
    });

    const sourceInboxMap = await SourceInboxMap.findOne({
      userId: userID,
      inboxId: conversation.category,
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const chatwootMessage = (await sendChatMessage(conversation.category, sourceInboxMap.sourceId, conversation.conversationId, message, req.user)).data;

    if (!chatwootMessage) {
      return res.status(500).json({ error: "Failed to send message" });
    }

    const payload = {
      type: 'incoming',
      message,
      timestamp: new Date(),
      chatwootId: chatwootMessage.id,
    };

    conversation.messages.push(payload);

    await conversation.save();

    wsService.sendMessage(conversation._id, {
      type: "incoming",
      message: messageContent,
      timestamp: messageCreatedAt,
    })

    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ error: "Failed to create message" });
    console.error(error);
  }
};

const handleConversationStatusChange = async (payload) => {
  const { id:conversationId, inbox_id:inboxId, contact_inbox:{source_id:contactIdentifier}, status } = payload;
  console.log("Parsing status change for",{
    conversationId,
    inboxId,
    contactIdentifier,
    status,
  })

  const conversation = await Conversation.findOne({
    conversationId
  })
  
  if(!conversation){
    console.log("Can't find conversation")
    throw new Error("Conversation Not Found")
  }

  console.log("Conversation Found! Changing Status.");

  conversation.status = status;

  await conversation.save();

  return conversation;
};

const handleOutgoingMessage = async (payload) => {
  const {
    conversation: {
      id: chatwootConversationId,
      inbox_id: inboxId,
      contact_inbox: { source_id: contactIdentifier },
      status: conversationStatus,
      can_reply: canReply,
    },
    content: messageContent,
    id: chatwootMessageId,
    sender: { name: senderName, email: senderEmail, type: senderType, id },
    created_at: messageCreatedAt,
  } = payload;

  console.log("Parsed Payload for 'message_created':", {
    chatwootConversationId,
    inboxId,
    contactIdentifier,
    messageContent,
    chatwootMessageId,
    senderName,
    conversationStatus,
    canReply,
    messageCreatedAt,
    senderEmail,
    senderType,
  });

  const conversation = await Conversation.findOne({
    conversationId: chatwootConversationId,
  });

  if (!conversation) {
    console.log("No matching conversation found.");
    throw new Error("Conversation not found");
  }

  console.log("Found conversation:", conversation);

  conversation.messages.push({
    type: "outgoing",
    message: messageContent,
    messageID: chatwootMessageId,
    timestamp: messageCreatedAt,
    agentData: {
      name: senderName,
      email: senderEmail,
      id,
    },
  });

  await conversation.save();

  console.log("Conversation updated successfully:", conversation);

  wsService.sendMessage(conversation._id, {
    type: "outgoing",
    message: messageContent,
    timestamp: messageCreatedAt,
    agentData: {
      name: senderName,
      email: senderEmail,
      id,
    }
  })

  return conversation;
};

exports.chatwootListener = async (req, res) =>{
  try{  
    console.log("Received payload:", req.body);
    const payload = req.body
    const {event, message_type} = payload
    if (event==="message_created"){
      
      if (message_type !== "outgoing"){
        console.log("Message type is not 'outgoing'. Ignoring...");
        return res.status(200).json({ success: true, message: "Ignored non-outgoing message" });    
      }
    
      await handleOutgoingMessage(payload);  
      return res.status(200).json({ success: true, message: "Message saved" });
    }

    if (event === "conversation_status_changed"){
      await handleConversationStatusChange(payload);
      return res.status(200).json({ success: true, message: "Conversation status updated" });
    }

    console.log("Unhandled Event Type:", event);
    res.status(400).json({ success: false, message: "Unhandled event type" });

  } catch{
    res.status(200).json({error:"Failed to parse message"});
  }
}


exports.createSocketMessage = async (payload) => {
  try {
    const { conversation_id, message, email } = payload;

    const userID = email.split("@")[0];

    if (!conversation_id || !message) {
      return {
        success: false,
        message: "conversation_id and message are required",
      };
    }

    const user = await users.findOne({
      email: email,
    });

    const conversation = await Conversation.findOne({
      _id: conversation_id,
      user: user._id,
    });

    const sourceInboxMap = await SourceInboxMap.findOne({
      userId: userID,
      inboxId: conversation.category,
    });

    if (!conversation) {
      return {
        success: false,
        message: "Conversation not found",
      };
    }

    const chatwootMessage = (await sendChatMessage(conversation.category, sourceInboxMap.sourceId, conversation.conversationId, message, {})).data;

    if (!chatwootMessage) {
      return {
        success: false,
        message: "Failed to send message",
      };
    }

    const response = {
      type: 'incoming',
      message,
      timestamp: new Date(),
      chatwootId: chatwootMessage.id,
    };

    conversation.messages.push(response);

    await conversation.save();

    return {
      success: true,
      message: "Message sent",
      payload: response,
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to create message",
      error
    }
  }
};

exports.logHeaders = async(req,res)=>{
   res.json(req.headers)
};
