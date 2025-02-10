const { Router } = require("express");
const { getChatCategories } = require("../controller/static.controller");
const staticRouter = Router();

staticRouter.get("/categories", getChatCategories);

module.exports = staticRouter;