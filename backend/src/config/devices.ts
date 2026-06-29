export interface Device {
  id: string;
  name: string;
  ip: string;
  type: 'AP' | 'Router' | 'Server';
  location: string;
  macAddress?: string;
  firmware?: string;
  model?: string;
  description?: string;

  historicalUptime30d?: number;
  historicalUptime1y?: number;
}

export const devices: Device[] = [

  {
    id: '2',
    name: 'Google DNS',
    ip: '8.8.8.8',
    type: 'Server',
    location: 'External',
    model: 'Google DNS Server',
    firmware: 'BIND 9.18-DNS',
    macAddress: '00:15:5D:8B:2A:4F',

    description: 'Primary Google Public DNS Server. Digunakan sebagai acuan kestabilan internet global.',
    historicalUptime30d: 100,
    historicalUptime1y: 99.99
  },
  {
    id: '3',
    name: 'Cloudflare DNS',
    ip: '1.1.1.1',
    type: 'Server',
    location: 'External',
    model: 'Cloudflare Core Server',
    firmware: 'EdgeOS v2.4',
    macAddress: '00:15:5D:8B:2B:12',

    description: 'Secondary Anycast DNS Resolver. Redundant backup untuk pengecekan koneksi luar.',
    historicalUptime30d: 99.98,
    historicalUptime1y: 99.95
  },
  { id: '4', name: 'OpenDNS', ip: '208.67.222.222', type: 'Server', location: 'External' },

];
