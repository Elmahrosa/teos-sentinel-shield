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
var cors_1 = require("cors");
var helmet_1 = require("helmet");
var dotenv_1 = require("dotenv");
var telegraf_1 = require("telegraf");
var axios_1 = require("axios");
// Import routes (Removed .js extensions for compatibility)
var health_1 = require("./routes/health");
var activation_1 = require("./routes/activation");
dotenv_1.default.config();
var app = (0, express_1.default)();
var PORT = process.env.PORT || 8080;
// Use the key from your .env file
var BOT_TOKEN = process.env.GATEWAY_BOT_TOKEN;
var BOT_SECRET = process.env.BOT_SHARED_SECRET;
// Middleware
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
// Mount routes
app.use('/health', health_1.default);
app.use('/activation', activation_1.default);
// Initialize Telegram Bot
if (BOT_TOKEN) {
    var bot = new telegraf_1.Telegraf(BOT_TOKEN);
    bot.start(function (ctx) {
        ctx.reply('🛡️ بوابة المحروسة (TEOS) جاهزة للعمل من الإسكندرية.\n\nاختر باقتك للبدء:');
    });
    bot.on('text', function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var txHash, response, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    txHash = ctx.message.text;
                    if (txHash.length < 30)
                        return [2 /*return*/];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.post("http://localhost:".concat(PORT, "/activation/verify"), {
                            txHash: txHash,
                            telegramUserId: ctx.from.id.toString(),
                            network: 'solana'
                        }, {
                            headers: { 'x-bot-secret': BOT_SECRET }
                        })];
                case 2:
                    response = _b.sent();
                    ctx.reply("\u2705 \u062A\u0645 \u0627\u0644\u062A\u0641\u0639\u064A\u0644!\n\u0631\u062E\u0635\u062A\u0643: ".concat(response.data.licenseKey));
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _b.sent();
                    console.error('Bot Verification Error:', ((_a = error_1.response) === null || _a === void 0 ? void 0 : _a.data) || error_1.message);
                    ctx.reply('❌ فشل التفعيل');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    bot.launch().then(function () {
        console.log('🤖 TEOS Bot is Live & Connected!');
    }).catch(function (err) {
        console.error('Bot launch failed:', err.message);
    });
}
// Start server
app.listen(PORT, function () {
    console.log("\uD83D\uDE80 Server running on http://localhost:".concat(PORT));
    console.log("\uD83D\uDCCA Health: http://localhost:".concat(PORT, "/health"));
    console.log("\uD83D\uDD17 Activation: POST http://localhost:".concat(PORT, "/activation/verify"));
});
exports.default = app;
