import '@testing-library/jest-dom/extend-expect';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeviceInspectorClient from '@/components/device-inspector/DeviceInspectorClient';
import { getDevice } from '@/lib/deviceApi';
import { enrichIp } from '@/lib/enrichmentApi';

// Mock the specific API modules
jest.mock('@/lib/deviceApi');
jest.mock('@/lib/enrichmentApi');

const mockGetDevice = getDevice as jest.Mock;
const mockEnrichIp = enrichIp as jest.Mock;

describe('DeviceInspectorClient', () => {
  it('renders device details and enrichment data after successful API calls', async () => {
    // Arrange: Set up the mock return values for our API calls
    mockGetDevice.mockResolvedValue({
      id: 'dev-1',
      ip: '8.8.8.8',
      mac: '00:11:22:33:44:55',
      os: 'Linux',
      hostname: 'test-device',
      status: 'online',
      alerts: ['Test alert'],
    });
    mockEnrichIp.mockResolvedValue({
      geoip: { country: 'US', city: 'Mountain View' },
    });

    // Act: Render the component
    render(<DeviceInspectorClient deviceId="dev-1" />);

    // Assert: Wait for the component to update and check for the expected text
    await waitFor(() => {
      expect(screen.getByText('test-device')).toBeInTheDocument();
    });

    expect(screen.getByText('online')).toBeInTheDocument();
    expect(screen.getByText(/US/)).toBeInTheDocument();
    expect(screen.getByText(/Mountain View/)).toBeInTheDocument();
    expect(screen.getByText('Test alert')).toBeInTheDocument();
  });
});