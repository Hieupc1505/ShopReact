const express = require("express");
const userRoute = require("./userRoute");

function route(app) {
  app.get("/", (req, res) => {
    res.send("Home Page");
  });
  app.use("/user", userRoute);
}

module.exports = route;
