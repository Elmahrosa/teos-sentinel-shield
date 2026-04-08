"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var nanoid_1 = require("nanoid");
var client_1 = require("@prisma/client");
var router = (0, express_1.Router)();
var prisma = new client_1.PrismaClient();
router.post('/verify', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, txHash_1, telegramUserId_1, _b, tier_1, incomingSecret, existingActivation, license, licenseKey_1, result, error_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 5, , 6]);
                _a = req.body, txHash_1 = _a.txHash, telegramUserId_1 = _a.telegramUserId, _b = _a.tier, tier_1 = _b === void 0 ? 'pioneer' : _b;
                incomingSecret = req.headers['x-bot-secret'];
                // 1. Security Handshake
                if (incomingSecret !== process.env.BOT_SHARED_SECRET) {
                    return [2 /*return*/, res.status(403).json({ ok: false, error: 'Unauthorized gateway' })];
                }
                return [4 /*yield*/, prisma.activation.findFirst({
                        where: { telegramUserId: telegramUserId_1.toString() }
                    })];
            case 1:
                existingActivation = _c.sent();
                if (!existingActivation) return [3 /*break*/, 3];
                return [4 /*yield*/, prisma.license.findFirst({
                        where: { activationId: existingActivation.id }
                    })];
            case 2:
                license = _c.sent();
                return [2 /*return*/, res.json({
                        ok: true,
                        licenseKey: license === null || license === void 0 ? void 0 : license.id,
                        status: 'already_active',
                        note: 'Existing license retrieved'
                    })];
            case 3:
                licenseKey_1 = "TEOS-".concat(tier_1.substring(0, 3).toUpperCase(), "-").concat((0, nanoid_1.nanoid)(8).toUpperCase());
                return [4 /*yield*/, prisma.$transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        var activation, license;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, tx.activation.create({
                                        data: {
                                            txHash: txHash_1,
                                            telegramUserId: telegramUserId_1.toString(),
                                            network: 'solana',
                                            status: 'completed'
                                        }
                                    })];
                                case 1:
                                    activation = _a.sent();
                                    return [4 /*yield*/, tx.license.create({
                                            data: {
                                                id: licenseKey_1,
                                                activationId: activation.id,
                                                tier: tier_1
                                            }
                                        })];
                                case 2:
                                    license = _a.sent();
                                    return [2 /*return*/, license];
                            }
                        });
                    }); })];
            case 4:
                result = _c.sent();
                console.log("[DB] New License Secured: ".concat(result.id, " for User ").concat(telegramUserId_1));
                res.json({
                    ok: true,
                    licenseKey: result.id,
                    status: 'activated',
                    activatedAt: new Date().toISOString()
                });
                return [3 /*break*/, 6];
            case 5:
                error_1 = _c.sent();
                console.error('Database Error:', error_1);
                res.status(500).json({ ok: false, error: 'Failed to secure license in vault' });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
