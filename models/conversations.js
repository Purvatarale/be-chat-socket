const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  category: { type: String, required: true },
  conversationId: { type: String, required: true }, // chatwoot Conversation ID.
  description: { type: String, required: true },
  status: { type: String, enum: ["open", "closed", "resolved", "pending"], default: "open" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  messages: [
    {
      type: { type: String, enum: ["incoming", "outgoing"], required: true },  //incoming outgoing messagetype
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      messageId: { type: String, required: false },
      agentData: { // this is for chatwoot sent messages (by agent) //agentdata
        name: { type:String, required:false },
        email: { type: String, required: false },
        id: { type: String, required: false },      //agent chatwoot id
      }   
    },
  ],
}, {timestamps: true});

module.exports = mongoose.model("Conversation", conversationSchema);
