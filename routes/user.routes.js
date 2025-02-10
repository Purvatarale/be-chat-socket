const express = require('express');
const router = express.Router();
const usercontroller = require('../controller/user.controller');

router.get('/whoami', usercontroller.whoAmI);

module.exports = router;