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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSession = generateSession;
exports.generatePremiumSession = generatePremiumSession;
const openai_1 = __importDefault(require("openai"));
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
// Ensure environment variables are loaded
dotenv_1.default.config();
// Debug: Log if API key exists (without exposing the key)
console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
}
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
//Free Preview
function generateSession(input) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        console.log("--- generateSession ---");
        try {
            const messages = [
                {
                    role: 'system',
                    content: `Eres un consultor experto en diseño de cursos e-learning, storytelling y estrategia con IA. 
        Ayudas a expertos y profesionales a transformar su conocimiento en propuestas de cursos e-learning claros, atractivos y listos para escalar con inteligencia artificial. 
        Tu objetivo es crear una transformación tangible y profesional. 
        Tu estilo debe ser inspirador, claro y accionable. 
        El output debe generar deseo inmediato de pasar a la versión Pro.
        La respuesta debe ser en español.
        RESPONDE SOLO CON UN OBJETO JSON VÁLIDO. NO INCLUYAS NINGÚN TEXTO, EXPLICACIÓN, NI MARKDOWN FUERA DEL JSON. Si incluyes texto fuera del JSON, la respuesta será rechazada.`
                },
                {
                    role: 'user',
                    content: `
    DATOS DEL EXPERTO:
    Nombre: ${input.nombre}
    Email: ${input.email}
    Tema/Servicio: ${input.servicio}
    Fortalezas: ${input.fortalezas}
    Audiencia objetivo: ${input.audiencia}
    Resultados esperados: ${input.resultados}
    
    Por favor, responde usando esta estructura:
    { 
        "propuesta_valor": "Texto de 3 a 5 líneas claro y persuasivo. Explica por qué este curso e-learning es único y la oportunidad de potenciarlo con IA.",
        "descripcion_potencia_ia": "Texto de 5 a 7 líneas sobre cómo la IA puede potenciar el curso e-learning del experto. Incluye 1 o 2 ejemplos concretos en relacion al experto su tematica y como su experiencia de aprendizaje particular seria mejorada con el uso de la IA.",
        "ideas_IA": [
          "Idea concreta basadas en el contenido propuesto 1 de cómo usar IA para potenciar el curso e-learning, deben ser cosas básicas fáciles de implementar que el experto pueda utilizar para potencias su experiencia de aprendizaje en 1 o 2 líneas. ",
          ...
          "Idea 5-7"
        ],
        "mapa_servicio": {
          "titulo_servicio": "Nombre poderoso y comercial para el curso e-learning",
          "modulos": [
            { "nombre": "Módulo 1: [Tema principal basado en el conocimiento del experto]", "descripcion": "Breve descripción del módulo y su objetivo." },
            { "nombre": "Módulo 2: [Tema complementario]", "descripcion": "Breve descripción del módulo y su objetivo." },
            { "nombre": "Módulo 3: [Tema avanzado o aplicación práctica]", "descripcion": "Breve descripción del módulo y su objetivo." },
            { "nombre": "Módulo 4: [Cierre, evaluación o escalabilidad]", "descripcion": "Breve descripción del módulo y su objetivo." }
          ]
        },
        "prompt_ejemplo": [
          { "modulo": "Módulo 1: Diagnóstico", "prompt": "Prompt para diagnóstico..." },
          { "modulo": "Módulo 2: Propuesta", "prompt": "Prompt para propuesta..." }
        ]
      }
    `
                }
            ];
            const response = yield openai.chat.completions.create({
                model: 'gpt-4',
                messages,
            });
            console.log("--- Response Generated ---");
            console.log((_a = response.choices[0].message) === null || _a === void 0 ? void 0 : _a.content);
            return {
                id: (0, uuid_1.v4)(),
                valueProp: ((_b = response.choices[0].message) === null || _b === void 0 ? void 0 : _b.content) || '',
                isPaid: false
            };
        }
        catch (error) {
            console.error('Error in generateSession:', error);
            throw error;
        }
    });
}
//Premium Session
function generatePremiumSession(input) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        console.log("--- generatePremiumSession ---");
        // Prompt mejorado
        const messages = [
            {
                role: 'system',
                content: `
Eres un consultor experto en diseño de cursos e-learning. Recibes la parte gratuita (preview) y debes generar la estructura completa del plan premium. Responde SOLO en JSON válido, SIN texto adicional. 
El campo 'premium' debe contener solo los datos premium, no repitas la parte gratuita. 
La respuesta debe ser en español.
No dejes ningún campo vacío ni como objeto vacío. Llena todos los campos con ejemplos realistas y detallados.

Para cada módulo, incluye los siguientes campos:
- nombre: nombre del módulo
- descripcion: breve descripción del módulo y su objetivo
- objetivo_aprendizaje: objetivo de aprendizaje claro y medible para el módulo
- sugerencias_contenido: lista de contenidos y actividades relevantes y actualizados, basados en el tema del módulo
- como_usar_ia: explicación de cómo se puede usar la IA en ese módulo para mejorar la experiencia de aprendizaje (ej: generación de ejercicios, feedback automático, personalización, etc.)
- procesos_internos: pasos o tareas que el experto debe preparar o realizar para esa clase (ej: preparar materiales, configurar herramientas, revisar entregas, etc.)
- tipos_recurso: tipos de recurso recomendados (ej: video, ebook, quiz, foro, etc.)
- duracion_semanas: duración sugerida del módulo en semanas

La estructura debe ser exactamente la siguiente (rellena todos los campos):
{
  "premium": {
    "propuesta_valor_pro": {
      "bio": "Instructor experto en [tema]. Destacado por ${input.fortalezas} para lograr ${input.resultados}.",
      "imagen_alt": "Imagen de una clase online con estudiantes participando activamente."
    },
    "mapa_servicio": {
      "titulo_servicio": "Nombre comercial y atractivo para el curso e-learning",
      "modulos": [
        {
          "nombre": "Módulo 1: [Tema principal]",
          "descripcion": "Breve descripción del módulo y su objetivo.",
          "objetivo_aprendizaje": "Objetivo de aprendizaje claro y medible para el módulo.",
          "sugerencias_contenido": ["Video introductorio sobre [tema]", "Lectura recomendada sobre [tema]", "Ejercicio práctico relacionado con [tema]"],
          "como_usar_ia": "Explica cómo el experto puede usar IA en este módulo, por ejemplo: generación de ejercicios personalizados, feedback automático, análisis de progreso, etc.",
          "procesos_internos": "Pasos que el experto debe preparar para esta clase, como crear materiales, configurar la plataforma, revisar entregas, etc.",
          "tipos_recurso": ["Video masterclass", "PDF descargable", "Quiz interactivo"],
          "duracion_semanas": 2
        },
        {
          "nombre": "Módulo 2: [Tema complementario]",
          "descripcion": "Breve descripción del módulo y su objetivo.",
          "objetivo_aprendizaje": "Objetivo de aprendizaje claro y medible para el módulo.",
          "sugerencias_contenido": ["Caso de estudio actualizado", "Foro de discusión sobre [tema]"],
          "como_usar_ia": "Explica cómo la IA puede ayudar a analizar casos o moderar foros, etc.",
          "procesos_internos": "Preparar el caso, moderar el foro, recopilar preguntas frecuentes, etc.",
          "tipos_recurso": ["Video", "Foro", "Checklist"],
          "duracion_semanas": 1
        },
        {
          "nombre": "Módulo 3: [Aplicación práctica]",
          "descripcion": "Breve descripción del módulo y su objetivo.",
          "objetivo_aprendizaje": "Objetivo de aprendizaje claro y medible para el módulo.",
          "sugerencias_contenido": ["Proyecto final basado en [tema]", "Feedback personalizado usando IA"],
          "como_usar_ia": "Explica cómo la IA puede ayudar a dar feedback automático o personalizar el proyecto.",
          "procesos_internos": "Revisar proyectos, configurar rúbricas de evaluación, usar herramientas de IA para feedback, etc.",
          "tipos_recurso": ["Plantilla editable", "Video feedback"],
          "duracion_semanas": 2
        },
        {
          "nombre": "Módulo 4: [Cierre y evaluación]",
          "descripcion": "Breve descripción del módulo y su objetivo.",
          "objetivo_aprendizaje": "Objetivo de aprendizaje claro y medible para el módulo.",
          "sugerencias_contenido": ["Evaluación final", "Certificado de participación"],
          "como_usar_ia": "Explica cómo la IA puede generar evaluaciones automáticas y certificados personalizados.",
          "procesos_internos": "Preparar la evaluación, configurar la entrega de certificados, analizar resultados, etc.",
          "tipos_recurso": ["Quiz", "Certificado PDF"],
          "duracion_semanas": 1
        }
      ]
    },
    "prompt_ejemplo": [
      {
        "modulo": "Módulo 1: [Tema principal]",
        "prompt": "Crea un prompt para ChatGPT que ayude al instructor a generar una introducción atractiva para el módulo, incluyendo objetivos de aprendizaje y actividades sugeridas."
      },
      {
        "modulo": "Módulo 2: [Tema complementario]",
        "prompt": "Crea un prompt para diseñar un caso de estudio relevante y preguntas para el foro de discusión."
      },
      {
        "modulo": "Módulo 3: [Aplicación práctica]",
        "prompt": "Crea un prompt para guiar a los estudiantes en la realización de un proyecto final y cómo recibir feedback personalizado."
      },
      {
        "modulo": "Módulo 4: [Cierre y evaluación]",
        "prompt": "Crea un prompt para generar una evaluación final y un mensaje de cierre motivador para los estudiantes."
      }
    ],
    "infografia": {
      "titulo": "Mapa del curso e-learning",
      "secciones": ["Diagnóstico", "Cierre de venta", "Acompañamiento", "Seguimiento"],
      "contenido": [
        "Evaluación inicial física y emocional del alumno para conocer su estado y necesidades.",
        "Presentación de una propuesta personalizada y cierre de inscripción.",
        "Clases semanales de yoga adaptadas a las necesidades del grupo.",
        "Evaluación mensual del progreso y ajuste de objetivos."
      ],
      "cta": "Aprende más sobre el curso e-learning"
    },
    "checklist_servicio": {
      "titulo": "Checklist de Calidad para tu Curso e-learning",
      "items": [
        "¿Cada módulo tiene objetivos claros?",
        "¿Incluyes recursos variados (video, texto, ejercicios)?",
        "¿Hay actividades prácticas y evaluaciones?",
        "¿El contenido es accesible y fácil de seguir?",
        "¿Ofreces feedback o soporte a los estudiantes?"
      ],
      "formato": "Editable en Notion y Google Docs"
    },
    "landing_page": {
      "url": "https://ewaffle.com/tu-curso",
      "contenido": {
        "pv_destacada": "Transforma tu conocimiento en resultados con este curso e-learning.",
        "modulos": ["Módulo 1: Introducción", "Módulo 2: Profundización", "Módulo 3: Práctica", "Módulo 4: Evaluación"],
        "testimonio_destacado": "'Este curso cambió mi forma de aprender y aplicar nuevos conocimientos.'",
        "cta": "Inscríbete ahora y lleva tu aprendizaje al siguiente nivel"
      }
    }
  }
}
\nIMPORTANTE: prompt_ejemplo debe ser SIEMPRE un array de objetos, nunca un string. Cada campo debe estar completo y realista.`
            },
            {
                role: 'user',
                content: `Aquí está la parte gratuita que ya generamos:\n${JSON.stringify(input.preview, null, 2)}\n\nAhora completa la parte "premium" usando la estructura y ejemplo anterior. No dejes ningún campo vacío ni como objeto vacío. Llena todos los campos con ejemplos realistas y detallados.`
            }
        ];
        const resp = yield openai.chat.completions.create({
            model: 'gpt-4',
            messages
        });
        const jsonText = ((_a = resp.choices[0].message) === null || _a === void 0 ? void 0 : _a.content) || '{}';
        const data = JSON.parse(jsonText);
        console.log("--- Data Generates---");
        return data.premium;
    });
}
