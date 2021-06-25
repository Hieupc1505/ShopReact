require("dotenv").config();
const jwt = require("jsonwebtoken");
const joi = require("../helpers/joyInput");
const accDB = require("../models/acc");
const createError = require("http-errors");
const sendMail = require("../Service/sendMail");
const { URL, ACCESSTOKEN_SECRET, REFRESHTOKEN_SECRET, MAIL_FROM } = process.env;
const bcrypt = require("bcrypt");

// route.post("/register", userCtl.register);
// route.get("/activate", useCtl.activate);
// route.post("/login", userCtl.login);

const getAccessToken = async (payload, timeout = "5d") => {
    return await jwt.sign(payload, ACCESSTOKEN_SECRET, {
        expiresIn: timeout,
    });
};

class userCtl {
    //POST /register
    async register(req, res, next) {
        try {
            const data = await joi.validateAsync(req.body, {
                abortEarly: false,
            });
            const { email, password } = data;
            const isExists = await accDB.findOne({ email: email });

            if (!email)
                throw new createError.Unauthorized("Email is already exists");

            const salt = await bcrypt.genSalt(10); //
            const hashPass = await bcrypt.hash(password, salt); //

            const tokenActivate = await getAccessToken(
                { email, password: hashPass },
                "2h"
            );
            console.log(tokenActivate);
            const url = `${URL}/activate/:${tokenActivate}`;

            const infor = sendMail(email, url, next);

            res.status(200).json({
                sucess: true, //
                msg: "Please check your email to activate your account",
            });
        } catch (err) {
            console.log(err);
            next(err);
        }
    }

    //[GET] /activate
    async activate(req, res) {
        const token = req.params.token;

        try {
            if (!token) throw new createError.Forbidden();

            const decoded = await jwt.verify(token, ACCESSTOKEN_SECRET);
            if (!decoded) throw new createError.Forbidden();

            const { email, password } = decoded;

            const newUser = await accDB.create({ email, password });
            console.log("user : " + newUser);

            res.json({
                sucess: true, //
                msg: "Account is activated",
            });
        } catch (err) {}
    }

    //[POST] /loign
    async login(req, res, next) {
        const { email, password } = req.body; //

        try {
            if (!email || !password)
                throw new createError.Unauthorized(
                    "Username or password is incorrect!!"
                );
            const user = await accDB.findOne({ email });
            if (user) {
                const isMatch = bcrypt.compare(user.password, password);
                if (isMatch) {
                    const accessToken = await getAccessToken({ id: user.id });
                    res.cookie(accessToken, accessToken);
                    res.json({
                        sucess: true, //
                        msg: "Login is sucessful",
                        accessToken,
                    });
                }
                throw new createError.Unauthorized(
                    "Email or password is not correct"
                );
            }
            throw new createError.Unauthorized("Email is not register");
        } catch (err) {
            console.log(err);
            next(err);
        }
    }
}

module.exports = new userCtl();
