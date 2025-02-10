const axios = require("axios");

const CHATWOOT_TOKEN = process.env.CHATWOOT_TOKEN;

const chatwootApi = axios.create({
  baseURL: "https://asciitb.online/public/api/v1/inboxes/"
})

async function createContact(inboxIdentifier, name, email, vouchData) {
  return chatwootApi.post(`${inboxIdentifier}/contacts`, {
    name,
    email,
  }, {
    headers: {
      'api_access_token': CHATWOOT_TOKEN,
      'Content-Type': 'application/json',
      "x-vouch-user": vouchData.vouchUser,
      "x-vouch-idp-idnumber": vouchData.vouchIdPIdNumber,
      "x-vouch-emptype": vouchData.vouchEmpType,
    }
  })
    
}

async function createConversation(inboxIdentifier, contactIdentifier, vouchData) {
  return chatwootApi.post(`${inboxIdentifier}/contacts/${contactIdentifier}/conversations`, {}, {
    headers: {
      'api_access_token': CHATWOOT_TOKEN,
      'Content-Type': 'application/json',
      "x-vouch-user": vouchData.vouchUser,
      "x-vouch-idp-idnumber": vouchData.vouchIdPIdNumber,
      "x-vouch-emptype": vouchData.vouchEmpType,
    }
  })
}

async function sendChatMessage(inboxIdentifier, contactIdentifier, conversationIdentifier, message, vouchData) {
  return chatwootApi.post(`${inboxIdentifier}/contacts/${contactIdentifier}/conversations/${conversationIdentifier}/messages`, {
    content: message,
    "message_type": "incoming"
  }, {
    headers: {
      'api_access_token': CHATWOOT_TOKEN,
      'Content-Type': 'application/json',
      "x-vouch-user": vouchData.vouchUser,
      "x-vouch-idp-idnumber": vouchData.vouchIdPIdNumber,
      "x-vouch-emptype": vouchData.vouchEmpType,
    }
  });
}

module.exports = {
  createContact,
  createConversation,
  sendChatMessage
};