export const VERSION = "0.0.1";

// Explicit exports to help Vite/Rollup static analysis
import { RoomState } from './types';
export { RoomState };

export * from './types';
export * from './events';
