import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const usePreferencesStore = create<any>()(persist((set) => ({ theme: 'dark', tableDensity: 'comfortable', setDensity: (d: 'compact'|'comfortable') => set({ tableDensity: d }) }), { name: 'adops-preferences' }));
