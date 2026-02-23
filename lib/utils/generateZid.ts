export function generateZid(): string {
  const prefixes = ['VOID', 'NEON', 'CYBR', 'DATA', 'ZERO', 'NOVA', 'ECHO', 'PULSE'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  
  const chars = '0123456789ABCDEF'; // Standard Hex characters
  let hex = '';
  for (let i = 0; i < 4; i++) {
    hex += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `Z-${prefix}-${hex}`;
}