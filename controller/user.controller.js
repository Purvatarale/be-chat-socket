const { createContact } = require("../helpers/chatwoot-helper");
const users = require("../models/user");
const SourceInboxMap = require("../models/source-inbox-map");

exports.whoAmI = async (req, res) => {
  try {
    return res.status(200).json(req.user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve user" });
  }
}

exports.createUser = async (email, name, inboxIdentifier, vouchData) => {
  try {

    console.log({
      email,
      name,
      inboxIdentifier,
      vouchData
    })

    if (!name || !email) {
      return { error: "Name and email are required" };
    }

    let existingUser = await users.findOne({
      email,
    });

    const chatWootUser = (await createContact(inboxIdentifier, name, email, vouchData)).data;

    if (!chatWootUser) {
      return { error: "Failed to create user in chatwoot" };
    }

    const { id, source_id: sourceId, pubsub_token: pubSubToken } = chatWootUser;

    if (!existingUser) {
      const newUser = new users({ email, name, chatwootId: id });
      await newUser.save();
      existingUser = newUser;
    }

    const sourceInboxMap = new SourceInboxMap({ userId: vouchData.userID, sourceId, inboxId: inboxIdentifier, pubSubToken });

    await sourceInboxMap.save();

    return {user: existingUser, sourceInboxMap};

  }
  catch (error) {
    console.error(error);
    throw new Error("Failed to create user");
  }
}

exports.createChatwootUser = async () => {

}