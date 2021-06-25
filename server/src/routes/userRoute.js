const route = require("express").Router();
const userCtl = require("../app/controller/userCtl");

route.post("/register", userCtl.register);
route.get("/activate/:token", userCtl.activate);
route.post("/login", userCtl.login);

module.exports = route;
