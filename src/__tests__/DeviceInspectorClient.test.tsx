import '@testing-library/jest-dom/extend-expect';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeviceInspectorClient from '../components/device-inspector/DeviceInspectorClient';

jest.mock('../lib/enrichmentApi', () => ({
  enrichIp: jest.fn().mockResolvedValue({ geoip: { country: 'US' } })
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      id: 'dev-1',
      ip: '8.8.8.8',
      mac: '00:11:22:33:44:55',
      os: 'Linux',
      hostname: 'test-device',
      status: 'online',
      enrichment: { geoip: { country: 'US' } },
      alerts: ['Test alert']
    })
  } as Response)
);
describe('DeviceInspectorClient', () => {
  it('renders device details and enrichment', async () => {
    render(<DeviceInspectorClient deviceId="dev-1" />);
    await waitFor(() => expect(screen.getByText('test-device')).toBeInTheDocument());
    expect(screen.getByText('online')).toBeInTheDocument();
    expect(screen.getByText(/US/)).toBeInTheDocument();
    expect(screen.getByText('Test alert')).toBeInTheDocument();
  });
});
