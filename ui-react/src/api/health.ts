import { apiGet } from './client'; export const getHealth = () => apiGet('/health');
