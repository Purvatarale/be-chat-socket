const mongoose = require("mongoose");
require("dotenv").config();

async function connectToDB() {
  const URI = process.env.MONGO_URI;
  try {
    await mongoose.connect(URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error(error);
  }
}

module.exports = { connectToDB };
