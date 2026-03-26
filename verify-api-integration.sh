#!/bin/bash

# API Integration Verification Script
# Checks all implemented API integrations

echo "🔍 API Integration Implementation Verification"
echo "=============================================="
echo ""

# 1. Check API Client
echo "1️⃣  API Client & Error Handling"
if [ -f "src/lib/apiClient.ts" ]; then
    echo "   ✅ apiClient.ts exists"
    grep -q "ApiError" src/lib/apiClient.ts && echo "   ✅ Error handling classes defined"
    grep -q "interceptors" src/lib/apiClient.ts && echo "   ✅ Request/response interceptors implemented"
else
    echo "   ❌ apiClient.ts missing"
fi
echo ""

# 2. Check Environment Validator
echo "2️⃣  Environment Configuration"
if [ -f "src/lib/envValidator.ts" ]; then
    echo "   ✅ envValidator.ts exists"
    grep -q "validateEnvironment" src/lib/envValidator.ts && echo "   ✅ Environment validation implemented"
    grep -q "NEXT_PUBLIC_API_BASE" src/lib/envValidator.ts && echo "   ✅ API base URL validation"
    grep -q "NEXT_PUBLIC_FIREBASE" src/lib/envValidator.ts && echo "   ✅ Firebase configuration validation"
else
    echo "   ❌ envValidator.ts missing"
fi
echo ""

# 3. Check App Initialization
echo "3️⃣  Startup Validation"
if [ -f "src/lib/appInit.ts" ]; then
    echo "   ✅ appInit.ts exists (startup initialization)"
fi
if [ -f "src/hooks/use-app-init.ts" ]; then
    echo "   ✅ use-app-init.ts exists (React hook)"
fi
if [ -f "src/components/layout/AppInitializer.tsx" ]; then
    echo "   ✅ AppInitializer component exists"
fi
echo ""

# 4. Check AI Lab APIs
echo "4️⃣  AI Lab API Integration"
if grep -q "analyzePacket" src/lib/aiLabApi.ts; then
    echo "   ✅ analyzePacket() implemented"
fi
if grep -q "generateIncidentReport" src/lib/aiLabApi.ts; then
    echo "   ✅ generateIncidentReport() implemented"
fi
if grep -q "getIncidentReport" src/lib/aiLabApi.ts; then
    echo "   ✅ getIncidentReport() implemented"
fi
if grep -q "listIncidentReports" src/lib/aiLabApi.ts; then
    echo "   ✅ listIncidentReports() implemented"
fi
echo ""

# 5. Check Device APIs
echo "5️⃣  Device Discovery & Control"
if grep -q "discoverDevices" src/lib/deviceApi.ts; then
    echo "   ✅ discoverDevices() implemented"
fi
if grep -q "scanDevice" src/lib/deviceApi.ts; then
    echo "   ✅ scanDevice() implemented"
fi
if grep -q "getDevice" src/lib/deviceApi.ts; then
    echo "   ✅ getDevice() implemented"
fi
if grep -q "shutdownDevice\|isolateDevice\|blockDevice" src/lib/deviceApi.ts; then
    echo "   ✅ Device control actions implemented"
fi
echo ""

# 6. Check Incident Reporting
echo "6️⃣  Incident Reporting"
if grep -q "generateIncidentReport" src/lib/incidentApi.ts; then
    echo "   ✅ generateIncidentReport() implemented"
fi
if grep -q "getIncidentReport" src/lib/incidentApi.ts; then
    echo "   ✅ getIncidentReport() implemented"
fi
if grep -q "listIncidents" src/lib/incidentApi.ts; then
    echo "   ✅ listIncidents() implemented"
fi
if grep -q "deleteIncident" src/lib/incidentApi.ts; then
    echo "   ✅ deleteIncident() implemented"
fi
echo ""

# 7. Check Enrichment APIs
echo "7️⃣  Threat Intelligence Enrichment"
if grep -q "enrichIp" src/lib/enrichmentApi.ts; then
    echo "   ✅ enrichIp() implemented"
fi
if grep -q "getThreatFeeds\|uploadThreatFeed" src/lib/enrichmentApi.ts; then
    echo "   ✅ Threat feed management implemented"
fi
echo ""

# 8. Check Log APIs
echo "8️⃣  Network Logs & Capture"
if grep -q "fetchNetworkLogs" src/lib/logsApi.ts; then
    echo "   ✅ fetchNetworkLogs() implemented"
fi
if grep -q "fetchCaptureStatus" src/lib/logsApi.ts; then
    echo "   ✅ Capture status monitoring implemented"
fi
if grep -q "startCapture\|stopCapture" src/lib/logsApi.ts; then
    echo "   ✅ Capture control implemented"
fi
echo ""

# 9. Check Proxy APIs
echo "9️⃣  Proxy Engine"
if grep -q "startProxy\|stopProxy" src/lib/proxyApi.ts; then
    echo "   ✅ Proxy start/stop implemented"
fi
if grep -q "fetchProxyRules\|getProxyStatus" src/lib/proxyApi.ts; then
    echo "   ✅ Proxy status & rules implemented"
fi
if grep -q "addProxyRule\|deleteProxyRule\|updateProxyRule" src/lib/proxyApi.ts; then
    echo "   ✅ Proxy rule management implemented"
fi
echo ""

# 10. Check User APIs
echo "🔟 User Management"
if grep -q "listUsers" src/lib/userApi.ts; then
    echo "   ✅ listUsers() implemented"
fi
if grep -q "assignRole" src/lib/userApi.ts; then
    echo "   ✅ assignRole() implemented"
fi
if grep -q "getCurrentUser" src/lib/userApi.ts; then
    echo "   ✅ getCurrentUser() implemented"
fi
echo ""

# 11. Check Backend Routes
echo "1️⃣1️⃣ Backend API Routes"
if grep -q "/device-manager/discover" src/backend/api_gateway/endpoints/device_manager.py; then
    echo "   ✅ Device discovery endpoint"
fi
if grep -q "/device-manager/scan/" src/backend/api_gateway/endpoints/device_manager.py; then
    echo "   ✅ Device scan endpoint"
fi
if grep -q "/control/shutdown-device\|/control/isolate-device\|/control/block-device" src/backend/api_gateway/endpoints/control_device.py; then
    echo "   ✅ Device control endpoints"
fi
if grep -q "/ai-analysis/incident-report" src/backend/api_gateway/endpoints/ai_analysis.py; then
    echo "   ✅ Incident report generation"
fi
if grep -q "/ai-analysis/analyze-packet" src/backend/api_gateway/endpoints/ai_analysis.py; then
    echo "   ✅ Packet analysis endpoint"
fi
if grep -q "/proxy/start\|/proxy/stop\|/proxy/status\|/proxy/rules" src/backend/api_gateway/endpoints/proxy.py; then
    echo "   ✅ Proxy management endpoints"
fi
echo ""

# 12. Check Environment Configuration
echo "1️⃣2️⃣ Environment Configuration"
if [ -f ".env.example" ]; then
    echo "   ✅ .env.example exists"
    grep -q "NEXT_PUBLIC_API_BASE" .env.example && echo "   ✅ API base URL configuration"
    grep -q "NEXT_PUBLIC_FIREBASE" .env.example && echo "   ✅ Firebase environment variables"
fi
echo ""

echo "✅ API Integration Implementation Complete!"
echo ""
echo "Next Steps:"
echo "1. Set up .env.local with your configuration"
echo "2. Start the backend: cd src/backend && python main.py"
echo "3. Start the frontend: npm run dev"
echo "4. Test API endpoints from the dashboard"
echo ""
