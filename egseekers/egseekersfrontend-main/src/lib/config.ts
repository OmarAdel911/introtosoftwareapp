import { config } from '@/config/env';

export const API_BASE_URL = config.apiUrl;
export const WS_BASE_URL = config.wsUrl;

// Other configuration constants can be added here as needed
export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const MAX_RETRIES = 3; 