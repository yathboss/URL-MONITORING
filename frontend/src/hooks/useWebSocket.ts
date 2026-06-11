import { PingResult } from '../types';

export function useWebSocket(_url: string): { lastMessage: PingResult | null; isConnected: boolean } {
  // Full implementation in Phase 4
  return { lastMessage: null, isConnected: false };
}
