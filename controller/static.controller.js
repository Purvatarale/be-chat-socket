const {CHAT_CATEGORIES} = require('../constants');

function getChatCategories(req, res) {
  res.json(CHAT_CATEGORIES);
}

module.exports = {
  getChatCategories,
};
