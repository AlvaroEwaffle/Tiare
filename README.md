# Ewaffle: Crea tu curso e-learning profesional con IA

Transforma tu conocimiento experto en una propuesta de curso e-learning clara, profesional y lista para vender. Ewaffle te ayuda a diseñar, estructurar y lanzar tu curso online en minutos, con el poder de la inteligencia artificial.

## Características principales
- Generador de propuesta de valor personalizada para cursos e-learning
- Sugerencias de mejora y estructura de módulos potenciada por IA
- Integración de pagos segura con MercadoPago
- UI moderna, responsiva y amigable
- Diferenciación entre versión gratuita (propuesta básica) y premium (estructura completa de módulos, checklist, infografía y landing page)

## Estructura del proyecto
- `backend/` — API Node.js/Express, integración con OpenAI y MercadoPago
- `frontend/` — App React, flujos de usuario, UI de pagos

## Primeros pasos

### Requisitos
- Node.js (v18+ recomendado)
- npm o yarn

### Configuración del backend
```sh
cd backend
cp .env.example .env # Agrega tus claves y configuración
npm install
npm run dev
```

### Configuración del frontend
```sh
cd frontend
npm install
npm run dev
```

### Variables de entorno
- **Nunca subas tus archivos `.env` al repositorio.**
- Agrega tus claves de OpenAI y MercadoPago en `backend/.env` (ver `.env.example`)

## Uso
1. Accede a la app frontend en tu navegador (usualmente http://localhost:5173)
2. Completa el formulario con tu experiencia y objetivos
3. Previsualiza tu propuesta de curso generada por IA
4. Desbloquea la estructura premium con pago seguro

## Seguridad
- Archivos sensibles como `.env` están excluidos por `.gitignore`
- Si subiste claves por error, usa `git filter-repo` para limpiar el historial

## Licencia
MIT 