export interface DetailedHealthCheckResponse {
  status: 'ok' | 'degraded';
  checks: {
    database: {
      status: 'ok' | 'error';
      latencyMs: number;
    };
    memory: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
    uptime: number;
    version: string;
    environment: string;
  };
}