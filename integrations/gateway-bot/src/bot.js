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
var telegraf_1 = require("telegraf");
var axios_1 = require("axios");
var config_js_1 = require("./config.js");
var bot = new telegraf_1.Telegraf(process.env.GATEWAY_BOT_TOKEN || '');
bot.start(function (ctx) {
    ctx.reply('🛡️ مرحباً بك في بوابة المحروسة (TEOS)\n\nاختر الباقة المناسبة لتفعيل خدماتك:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: "💎 Pioneer (1.5 SOL)", callback_data: "pioneer" }],
                [{ text: "🚀 Builder (12 SOL)", callback_data: "builder" }],
                [{ text: "👑 Sovereign (75+ SOL)", callback_data: "sovereign" }]
            ]
        }
    });
});
bot.on('callback_query', function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
    var tier;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                tier = ctx.callbackQuery.data;
                return [4 /*yield*/, ctx.reply("\u0644\u0642\u062F \u0627\u062E\u062A\u0631\u062A \u0628\u0627\u0642\u0629 ".concat(tier.toUpperCase(), ".\n\u0627\u0644\u0631\u062C\u0627\u0621 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0640 Transaction Hash \u0644\u0644\u062A\u0623\u0643\u062F \u0645\u0646 \u0627\u0644\u062F\u0641\u0639:"))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
bot.on('text', function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
    var txHash, response, error_1;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                txHash = ctx.message.text;
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                return [4 /*yield*/, axios_1.default.post('http://localhost:8080/activation/verify', {
                        txHash: txHash,
                        telegramUserId: ctx.from.id.toString(),
                        network: 'solana'
                    }, {
                        headers: { 'x-bot-secret': config_js_1.env.BOT_SHARED_SECRET }
                    })];
            case 2:
                response = _c.sent();
                ctx.reply('✅ تم التفعيل بنجاح! رخصتك هي: ' + response.data.licenseKey);
                return [3 /*break*/, 4];
            case 3:
                error_1 = _c.sent();
                ctx.reply('❌ فشل التفعيل: ' + (((_b = (_a = error_1.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.reason) || 'خطأ في النظام'));
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
bot.launch().then(function () { return console.log('🤖 TEOS Bot is Live!'); });
