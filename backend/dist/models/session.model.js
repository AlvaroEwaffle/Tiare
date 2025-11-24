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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Sub-schemas for nested objects
const PropuestaValorProSchema = new mongoose_1.Schema({
    bio: String,
    imagen_alt: String
});
const ModuloSchema = new mongoose_1.Schema({
    nombre: String,
    descripcion: String,
    objetivo_aprendizaje: String,
    sugerencias_contenido: [String],
    como_usar_ia: String,
    procesos_internos: [String],
    tipos_recurso: [String],
    duracion_semanas: Number
});
const MapaServicioSchema = new mongoose_1.Schema({
    titulo_servicio: String,
    modulos: [ModuloSchema]
});
const PromptEjemploSchema = new mongoose_1.Schema({
    modulo: String,
    prompt: String
});
const InfografiaSchema = new mongoose_1.Schema({
    titulo: String,
    secciones: [String],
    contenido: [String],
    cta: String
});
const ChecklistServicioSchema = new mongoose_1.Schema({
    titulo: String,
    items: [String],
    formato: String
});
const LandingPageSchema = new mongoose_1.Schema({
    url: String,
    contenido: {
        pv_destacada: String,
        modulos: [String],
        testimonio_destacado: String,
        cta: String
    }
});
const ProSchema = new mongoose_1.Schema({
    propuesta_valor_pro: PropuestaValorProSchema,
    mapa_servicio: MapaServicioSchema,
    prompt_ejemplo: [PromptEjemploSchema],
    infografia: InfografiaSchema,
    checklist_servicio: ChecklistServicioSchema,
    landing_page: LandingPageSchema
});
const sessionSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    service: { type: String, required: true },
    strengths: { type: String, required: true },
    targetAudience: { type: String, required: true },
    results: { type: String, required: true },
    // Preview fields
    propuesta_valor: { type: String },
    descripcion_potencia_ia: { type: String },
    ideas_IA: [{ type: String }],
    // Pro fields
    pro: {
        propuesta_valor_pro: PropuestaValorProSchema,
        mapa_servicio: MapaServicioSchema,
        prompt_ejemplo: [PromptEjemploSchema],
        infografia: InfografiaSchema,
        checklist_servicio: ChecklistServicioSchema,
        landing_page: LandingPageSchema
    },
    isPaid: { type: Boolean, default: false },
    premium_development: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    paymentId: { type: String, required: false },
    promoCode: { type: String, required: false },
    promoCodeApplied: { type: Boolean, default: false },
});
exports.Session = mongoose_1.default.model('Session', sessionSchema);
