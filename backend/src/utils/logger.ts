// Simple logger utility for console tracking
const libName = 'YPG-Service';

export const logger = {
  info: (msg: string) => console.log(`INFO [${libName}] ${msg}`),
  warn: (msg: string) => console.warn(`WARN [${libName}] ${msg}`),
  error: (msg: string) => console.error(`ERROR [${libName}] ${msg}`),
};
