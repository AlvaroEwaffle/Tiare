import 'dotenv/config';
import axios from 'axios';
import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import type { BackendConfig } from './types/common';
import { registerAppointmentTools } from './tools/appointments';
import { registerPatientTools } from './tools/patients';
import { registerCalendarTools } from './tools/calendar';

const backendConfig: BackendConfig = {
  baseUrl: process.env.TIARE_BACKEND_URL || 'http://localhost:3002',
  authToken: process.env.TIARE_BACKEND_TOKEN
};

const http = axios.create({
  baseURL: backendConfig.baseUrl,
  timeout: 15000
});

http.interceptors.request.use((config) => {
  if (backendConfig.authToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${backendConfig.authToken}`;
  }
  return config;
});

const server = new Server(
  {
    name: 'tiare-mcp-server',
    version: '0.1.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Registro de tools agrupados por dominio funcional
registerAppointmentTools(server, http);
registerPatientTools(server, http);
registerCalendarTools(server, http);

const transport = new StdioServerTransport();
server.connect(transport);


