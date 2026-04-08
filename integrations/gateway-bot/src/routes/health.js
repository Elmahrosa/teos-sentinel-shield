"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var router = (0, express_1.Router)();
router.get('/', function (req, res) {
    res.json({
        status: 'ok',
        service: 'teos-activation-service',
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
