import mongoose, { Document, Schema } from 'mongoose';

// Sub-schemas for nested objects
const PropuestaValorProSchema = new Schema({
  bio: String,
  imagen_alt: String
});

const ModuloSchema = new Schema({
  nombre: String,
  descripcion: String,
  objetivo_aprendizaje: String,
  sugerencias_contenido: [String],
  como_usar_ia: String,
  procesos_internos: [String],
  tipos_recurso: [String],
  duracion_semanas: Number
});

const MapaServicioSchema = new Schema({
  titulo_servicio: String,
  modulos: [ModuloSchema]
});

const PromptEjemploSchema = new Schema({
  modulo: String,
  prompt: String
});

const InfografiaSchema = new Schema({
  titulo: String,
  secciones: [String],
  contenido: [String],
  cta: String
});

const ChecklistServicioSchema = new Schema({
  titulo: String,
  items: [String],
  formato: String
});

const LandingPageSchema = new Schema({
  url: String,
  contenido: {
    pv_destacada: String,
    modulos: [String],
    testimonio_destacado: String,
    cta: String
  }
});

const ProSchema = new Schema({
  propuesta_valor_pro: PropuestaValorProSchema,
  mapa_servicio: MapaServicioSchema,
  prompt_ejemplo: [PromptEjemploSchema],
  infografia: InfografiaSchema,
  checklist_servicio: ChecklistServicioSchema,
  landing_page: LandingPageSchema
});

export interface ISession extends Document {
  id: string;
  name: string;
  email: string;
  service: string;
  strengths: string;
  targetAudience: string;
  results: string;
  // Preview fields
  propuesta_valor: string;
  descripcion_potencia_ia: string;
  ideas_IA: string[];
  // Pro fields
  pro: {
    propuesta_valor_pro: {
      bio: string;
      imagen_alt: string;
    };
    mapa_servicio: {
      titulo_servicio: string;
      modulos: Array<{
        nombre: string;
        descripcion: string;
        objetivo_aprendizaje: string;
        sugerencias_contenido: string[];
        como_usar_ia: string;
        procesos_internos: string[];
        tipos_recurso: string[];
        duracion_semanas: number;
      }>;
    };
    prompt_ejemplo: Array<{
      modulo: string;
      prompt: string;
    }>;
    infografia: {
      titulo: string;
      secciones: string[];
      contenido: string[];
      cta: string;
    };
    checklist_servicio: {
      titulo: string;
      items: string[];
      formato: string;
    };
    landing_page: {
      url: string;
      contenido: {
        pv_destacada: string;
        modulos: string[];
        testimonio_destacado: string;
        cta: string;
      };
    };
  };
  isPaid: boolean;
  premium_development: boolean;
  createdAt: Date;
  paymentId: string;
  promoCode: string;
  promoCodeApplied: boolean;
}

const sessionSchema = new Schema<ISession>({
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

export const Session = mongoose.model<ISession>('Session', sessionSchema); 