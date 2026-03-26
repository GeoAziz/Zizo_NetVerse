/**
 * Health Check Endpoint
 * Add this to src/app/api/health/route.ts
 */

export async function GET() {
  try {
    const health: { status: string; timestamp: string; uptime: number; environment: string | undefined; backend?: string } = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    };

    // Check backend connectivity
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const backendHealth = await fetch(`${backendUrl}/api/v1/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      health.backend = backendHealth.ok ? 'connected' : 'unhealthy';
    } catch (error) {
      health.backend = 'disconnected';
    }

    return new Response(JSON.stringify(health), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
