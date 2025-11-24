export interface BackendConfig {
  baseUrl: string;
  /**
   * JWT de un doctor específico de Tiare que el MCP usará para autenticarse.
   * Para un MVP se asume un único doctor por instancia de servidor MCP.
   */
  authToken?: string;
}

export interface McpErrorPayload {
  message: string;
  status?: number;
  details?: unknown;
}


