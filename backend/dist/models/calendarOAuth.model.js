"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarOAuth = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const calendarOAuthSchema = new mongoose_1.Schema({
    doctorId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    accessToken: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    scope: {
        type: String,
        required: true,
        default: 'https://www.googleapis.com/auth/calendar'
    },
    tokenType: {
        type: String,
        required: true,
        default: 'Bearer'
    },
    calendarId: {
        type: String,
        required: false
    },
    calendarName: {
        type: String,
        required: false
    },
    lastSync: {
        type: Date,
        required: false
    },
    nextSync: {
        type: Date,
        required: false
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true
    }
}, {
    timestamps: true,
    collection: 'doctors'
});
// Crear un subdocumento para el calendario OAuth
const calendarOAuthSubSchema = new mongoose_1.Schema({
    calendar: {
        oauth: {
            accessToken: String,
            refreshToken: String,
            expiryDate: Date,
            scope: {
                type: String,
                default: 'https://www.googleapis.com/auth/calendar'
            },
            tokenType: {
                type: String,
                default: 'Bearer'
            },
            calendarId: String,
            calendarName: String,
            lastSync: Date,
            nextSync: Date,
            isActive: {
                type: Boolean,
                default: true
            }
        }
    }
});
// Agregar el subdocumento al schema del doctor
const doctorSchema = (_a = mongoose_1.default.models.Doctor) === null || _a === void 0 ? void 0 : _a.schema;
if (doctorSchema) {
    doctorSchema.add(calendarOAuthSubSchema);
}
exports.CalendarOAuth = mongoose_1.default.model('CalendarOAuth', calendarOAuthSchema);
exports.default = exports.CalendarOAuth;
