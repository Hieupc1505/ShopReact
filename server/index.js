require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const route = require("./src/routes/index");
const db = require("./src/app/config/db");
const createError = require("http-errors");

const app = express();
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

route(app);

app.use((req, res, next) => {
    next(createError.NotFound("Page is not found"));
});
app.use((err, req, res, next) => {
    console.log(err);
    res.status(err.status || 500)
        .json({
            sucess: false,
            msg: err.msg || "Internal Server errorrs",
        })
        .end();
});

const port = process.env.LINK_PORT || 5000;
app.listen(port, () => {
    console.log("App is running...!!");
});
