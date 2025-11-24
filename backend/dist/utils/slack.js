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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSlackNotification = sendSlackNotification;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
function sendSlackNotification(text) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!SLACK_WEBHOOK_URL) {
            console.warn('SLACK_WEBHOOK_URL is not set');
            return;
        }
        try {
            console.log("Sending Slack notification:", text);
            const res = yield fetch(SLACK_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            if (!res.ok) {
                console.error('Failed to send Slack notification:', yield res.text());
            }
        }
        catch (err) {
            console.error('Error sending Slack notification:', err);
        }
    });
}
