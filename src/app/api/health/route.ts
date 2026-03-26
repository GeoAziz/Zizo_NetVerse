/**
 * Health Check Endpoint
 * GET /api/health
 */

export async function GET() {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      service: 'Zizo_NetVerse_Frontend',
      backend: 'unknown' as string,
    };

    // Check backend connectivity
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const backendHealth = await fetch(`${backendUrl}/api/v1/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      health.backend = backendHealth.ok ? 'connected' : 'unhealthy';
    } catch (error) {
      health.backend = 'disconnected';
    }

    return Response.json(health, { status: 200 });
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
