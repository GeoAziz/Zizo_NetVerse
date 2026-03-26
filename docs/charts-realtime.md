# Charts & Real-Time Data Optimization

## Current State
- Charts update in real-time via WebSocket.
- Some charts lack loading/error states.

## Recommendations
- Debounce/throttle updates for high-frequency data.
- Add loading and error states to all charts.
- Ensure all charts are responsive on mobile/tablet.
- Add tooltips and legends for clarity.
- Test with large data volumes for performance.
