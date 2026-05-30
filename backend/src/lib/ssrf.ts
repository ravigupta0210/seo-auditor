import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const PRIVATE_IPV4_RANGES: Array<[number, number]> = [
  [ipToInt('10.0.0.0'), ipToInt('10.255.255.255')],
  [ipToInt('172.16.0.0'), ipToInt('172.31.255.255')],
  [ipToInt('192.168.0.0'), ipToInt('192.168.255.255')],
  [ipToInt('127.0.0.0'), ipToInt('127.255.255.255')],
  [ipToInt('169.254.0.0'), ipToInt('169.254.255.255')],
  [ipToInt('100.64.0.0'), ipToInt('100.127.255.255')],
  [ipToInt('0.0.0.0'), ipToInt('0.255.255.255')],
];

function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0;
}

function isPrivateIPv4(ip: string): boolean {
  const n = ipToInt(ip);
  return PRIVATE_IPV4_RANGES.some(([lo, hi]) => n >= lo && n <= hi);
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::') return true;
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // fc00::/7
  if (lower.startsWith('fe80:')) return true; // link-local
  if (lower.startsWith('::ffff:')) {
    const v4 = lower.replace('::ffff:', '');
    return isIP(v4) === 4 && isPrivateIPv4(v4);
  }
  return false;
}

export async function assertPublicHostname(hostname: string): Promise<void> {
  if (!hostname) throw new Error('hostname required');

  if (isIP(hostname)) {
    if (isIP(hostname) === 4 && isPrivateIPv4(hostname)) {
      throw new Error('Refusing to fetch private IPv4 address');
    }
    if (isIP(hostname) === 6 && isPrivateIPv6(hostname)) {
      throw new Error('Refusing to fetch private IPv6 address');
    }
    return;
  }

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new Error('Refusing to fetch localhost');
  }

  const records = await lookup(hostname, { all: true });
  for (const r of records) {
    if (r.family === 4 && isPrivateIPv4(r.address)) {
      throw new Error(`Hostname ${hostname} resolves to private IPv4 ${r.address}`);
    }
    if (r.family === 6 && isPrivateIPv6(r.address)) {
      throw new Error(`Hostname ${hostname} resolves to private IPv6 ${r.address}`);
    }
  }
}
