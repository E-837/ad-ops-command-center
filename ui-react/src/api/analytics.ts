import { apiGet } from './client';
export async function getDashboard() { return apiGet<any>('/dashboard'); }
