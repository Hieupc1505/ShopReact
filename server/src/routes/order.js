/**
 * Created by vinhnt on 6/16/2017.
 */

//         "dateformat": "^2.2.0",
//         "qs": "^6.7.0",
//         "sha256": "^0.2.0"
require("dotenv").config();

var express = require("express");
var router = express.Router();

const { vnp_TmnCode, vnp_HashSecret, vnp_Url, vnp_ReturnUrl } = process.env;

router.get("/", function (req, res, next) {
    res.render("orderlist", { title: "Danh sách đơn hàng" });
});

router.get("/create_payment_url", function (req, res, next) {
    var dateFormat = require("dateformat");
    var date = new Date();

    var desc =
        "Thanh toan don hang thoi gian: " +
        dateFormat(date, "yyyy-mm-dd HH:mm:ss");
    res.render("order", {
        title: "Tạo mới đơn hàng",
        amount: 10000,
        description: desc,
    });
});

router.post("/create_payment_url", function (req, res, next) {
    var ipAddr =
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    var dateFormat = require("dateformat");

    var tmnCode = vnp_TmnCode;
    var secretKey = vnp_HashSecret;
    var vnpUrl = vnp_Url;
    var returnUrl = vnp_ReturnUrl;

    var date = new Date();

    var createDate = dateFormat(date, "yyyymmddHHmmss");
    var orderId = dateFormat(date, "HHmmss");
    var amount = req.body.amount;
    var bankCode = req.body.bankCode;

    var orderInfo =
        req.body.orderDescription + dateFormat(date, "yyyy-mm-dd HH:mm:ss");
    var orderType = req.body.orderType;
    var locale = req.body.language;
    if (locale === null || locale === "") {
        locale = "vn";
    }
    var currCode = "VND";
    var vnp_Params = {};
    vnp_Params["vnp_Version"] = "2";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    // vnp_Params['vnp_Merchant'] = ''
    vnp_Params["vnp_Locale"] = locale;
    vnp_Params["vnp_CurrCode"] = currCode;
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] = orderInfo;
    vnp_Params["vnp_OrderType"] = orderType;
    vnp_Params["vnp_Amount"] = amount * 100;
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;
    if (bankCode !== null && bankCode !== "") {
        vnp_Params["vnp_BankCode"] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    var querystring = require("qs");
    var signData =
        secretKey + querystring.stringify(vnp_Params, { encode: false });

    var sha256 = require("sha256");

    var secureHash = sha256(signData);

    vnp_Params["vnp_SecureHashType"] = "SHA256";
    vnp_Params["vnp_SecureHash"] = secureHash;
    vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: true });

    //Neu muon dung Redirect thi dong dong ben duoi
    res.status(200).json({ code: "00", url: vnpUrl });
    //Neu muon dung Redirect thi mo dong ben duoi va dong dong ben tren
    // res.redirect(vnpUrl);
});

router.get("/vnpay_return", function (req, res, next) {
    var vnp_Params = req.query;

    var secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);

    var tmnCode = vnp_TmnCode;
    var secretKey = vnp_HashSecret;

    var querystring = require("qs");
    var signData =
        secretKey + querystring.stringify(vnp_Params, { encode: false });

    var sha256 = require("sha256");

    var checkSum = sha256(signData);

    if (secureHash === checkSum) {
        //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua

        // res.render("success", { code: vnp_Params["vnp_ResponseCode"] });
        res.json({
            success: true,
            msg: vnp_Params,
        });
    } else {
        // res.render("success", { code: "97" });
        res.json({
            success: false,
            msg: vnp_Params,
        });
    }
});

router.get("/vnpay_ipn", function (req, res, next) {
    var vnp_Params = req.query;
    var secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);
    var config = require("config");
    var secretKey = vnp_HashSecret;
    var querystring = require("qs");
    var signData =
        secretKey + querystring.stringify(vnp_Params, { encode: false });

    var sha256 = require("sha256");

    var checkSum = sha256(signData);

    if (secureHash === checkSum) {
        var orderId = vnp_Params["vnp_TxnRef"];
        var rspCode = vnp_Params["vnp_ResponseCode"];
        //Kiem tra du lieu co hop le khong, cap nhat trang thai don hang va gui ket qua cho VNPAY theo dinh dang duoi
        res.status(200).json({ RspCode: "00", Message: "success" });
    } else {
        res.status(200).json({ RspCode: "97", Message: "Fail checksum" });
    }
});

function sortObject(o) {
    var sorted = {},
        key,
        a = [];

    for (key in o) {
        if (o.hasOwnProperty(key)) {
            a.push(key);
        }
    }

    a.sort();

    for (key = 0; key < a.length; key++) {
        sorted[a[key]] = o[a[key]];
    }
    return sorted;
}

module.exports = router;
