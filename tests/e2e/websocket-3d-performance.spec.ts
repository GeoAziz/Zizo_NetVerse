// Playwright E2E Tests for 3D Visualization WebSocket Performance
// Run with: npx playwright test tests/e2e/websocket-3d-performance.spec.ts

import { test, expect, BrowserContext } from '@playwright/test';

test.describe('3D Visualization WebSocket Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the network visualization page
    await page.goto('/network-visualization');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should handle concurrent WebSocket connections (10 active)', async ({ page, context }: { page: import('@playwright/test').Page, context: BrowserContext }) => {
    const connectionTimings: number[] = [];
    const messageTimings: number[] = [];

    // Capture WebSocket events
    let wsConnectionCount = 0;
    let wsMessageCount = 0;

    page.on('websocket', (ws) => {
      const connectTime = Date.now();
      wsConnectionCount++;
      
      ws.on('framereceived', (_frame) => {
        const receiveTime = Date.now();
        messageTimings.push(receiveTime - connectTime);
        wsMessageCount++;
      });

      connectionTimings.push(Date.now() - connectTime);
    });

    // Simulate high WebSocket load by opening multiple connections
    const pages = [page];
    for (let i = 1; i < 10; i++) {
      const newPage = await context.newPage();
      pages.push(newPage);
      await newPage.goto('/network-visualization');
      await newPage.waitForLoadState('networkidle');
    }

    // Monitor performance over 30 seconds
    await page.waitForTimeout(30000);

    // Verify performance metrics
    const avgConnectionTime = connectionTimings.reduce((a, b) => a + b, 0) / connectionTimings.length;
    const avgMessageTime = messageTimings.reduce((a, b) => a + b, 0) / messageTimings.length || 0;

    expect(avgConnectionTime).toBeLessThan(500);
    if (messageTimings.length > 0) {
      expect(avgMessageTime).toBeLessThan(100);
    }

    // Cleanup
    for (let i = 1; i < pages.length; i++) {
      await pages[i].close();
    }
  });

  test('should render 3D scene without lag', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    // Wait for canvas to be visible
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Measure frame rate consistency
    const frameTimings = [];
    let lastTime = Date.now();

    for (let i = 0; i < 300; i++) {
      // Simulate user interaction (rotation)
      await page.evaluate(() => {
        // This would interact with Three.js scene
        const event = new WheelEvent('wheel', {
          deltaY: Math.random() * 100 - 50,
          bubbles: true,
        });
        document.querySelector('canvas')?.dispatchEvent(event);
      });

      const currentTime = Date.now();
      frameTimings.push(currentTime - lastTime);
      lastTime = currentTime;

      if (i % 30 === 0) {
        await page.waitForTimeout(16); // ~60 FPS
      }
    }

    // Calculate FPS metrics
    const avgFrameTime = frameTimings.reduce((a, b) => a + b, 0) / frameTimings.length;
    const fps = 1000 / avgFrameTime;

    // Expect at least 30 FPS during load test
    expect(fps).toBeGreaterThan(30);
    
    // Check memory didn't spike excessively
    const metrics = await page.evaluate(() => {
      const perf = performance as Performance & {
        memory?: {
          usedJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      };

      if (perf.memory) {
        return {
          usedJSHeapSize: perf.memory.usedJSHeapSize,
          jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
        };
      }
      return null;
    });

    if (metrics) {
      const heapUsagePercent = (metrics.usedJSHeapSize / metrics.jsHeapSizeLimit) * 100;
      expect(heapUsagePercent).toBeLessThan(80);
    }
  });

  test('should handle device node interactions smoothly', async ({ page }) => {
    const interactionTimings = [];

    for (let i = 0; i < 100; i++) {
      const startTime = Date.now();

      // Simulate clicking on device nodes
      await page.evaluate(() => {
        // Raycasting or click handlers on Three.js scene
        const randomX = Math.random() * window.innerWidth;
        const randomY = Math.random() * window.innerHeight;
        
        const event = new MouseEvent('click', {
          clientX: randomX,
          clientY: randomY,
          bubbles: true,
        });
        document.querySelector('canvas')?.dispatchEvent(event);
      });

      await page.waitForTimeout(50); // Simulate user think time

      const interactionTime = Date.now() - startTime;
      interactionTimings.push(interactionTime);

      // Check if any popover/tooltip appeared
      const hasPopover = await page.locator('[role="dialog"], [role="tooltip"]').isVisible().catch(() => false);
      if (hasPopover) {
        // Interaction was responsive
        expect(interactionTime).toBeLessThan(200);
      }
    }

    const avgInteractionTime = interactionTimings.reduce((a, b) => a + b, 0) / interactionTimings.length;
    expect(avgInteractionTime).toBeLessThan(150);
  });

  test('should not leak memory during extended use', async ({ page }) => {
    const memorySnapshots = [];

    for (let i = 0; i < 10; i++) {
      const memory = await page.evaluate(() => {
        const perf = performance as Performance & {
          memory?: {
            usedJSHeapSize: number;
          };
        };

        if (perf.memory) {
          return perf.memory.usedJSHeapSize;
        }
        return 0;
      });

      memorySnapshots.push(memory);

      // Perform various interactions
      await page.evaluate(() => {
        // Pan, zoom, rotate the 3D scene
        ['mousemove', 'wheel', 'mousedown', 'mouseup'].forEach(eventType => {
          const event = new Event(eventType, { bubbles: true });
          document.querySelector('canvas')?.dispatchEvent(event);
        });
      });

      await page.waitForTimeout(1000);
    }

    // Check for memory growth (should be relatively stable)
    const initialMemory = memorySnapshots[0];
    const finalMemory = memorySnapshots[memorySnapshots.length - 1];
    const memoryGrowthPercent = ((finalMemory - initialMemory) / initialMemory) * 100;

    // Allow up to 50% memory growth over the test
    expect(memoryGrowthPercent).toBeLessThan(50);
  });

  test('should optimize rendering with visible updates only', async ({ page }) => {
    // Wait for baseline rendering
    const baselineUpdates = await page.evaluate(async () => {
      const end = performance.now() + 5000;
      let updates = 0;

      await new Promise<void>((resolve) => {
        const tick = () => {
          updates++;
          if (performance.now() >= end) {
            resolve();
            return;
          }
          requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      });

      return updates;
    });

    // Minimize window / hide canvas
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        (canvas as any).style.display = 'none';
      }
    });

    const hiddenUpdates = await page.evaluate(async () => {
      const end = performance.now() + 5000;
      let updates = 0;

      await new Promise<void>((resolve) => {
        const tick = () => {
          updates++;
          if (performance.now() >= end) {
            resolve();
            return;
          }
          requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      });

      return updates;
    });

    expect(hiddenUpdates).toBeLessThanOrEqual(baselineUpdates);

    // Show canvas again
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        (canvas as any).style.display = 'block';
      }
    });

    await page.waitForTimeout(2000);
  });

  test('should handle network lag gracefully', async ({ page, context }: { page: import('@playwright/test').Page, context: BrowserContext }) => {
    // Enable throttling to simulate network lag
    const cdpSession = await context.newCDPSession(page);
    await cdpSession.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 100 * 1024 / 8, // 100 kb/s
      uploadThroughput: 50 * 1024 / 8,    // 50 kb/s
      latency: 500,                        // 500ms latency
    });

    const startTime = Date.now();
    
    // Try to interact with the visualization
    for (let i = 0; i < 50; i++) {
      await page.evaluate(() => {
        const event = new WheelEvent('wheel', {
          deltaY: Math.random() * 100 - 50,
          bubbles: true,
        });
        document.querySelector('canvas')?.dispatchEvent(event);
      });

      await page.waitForTimeout(100);
    }

    const totalTime = Date.now() - startTime;

    // Even with lag, should complete in reasonable time
    expect(totalTime).toBeLessThan(30000);

    // Should not crash or error
    const errors = await page.evaluate(() => {
      return (window as any).__errors || [];
    }).catch(() => []);

    expect(errors.length).toBe(0);

    await cdpSession.detach();
  });
});
