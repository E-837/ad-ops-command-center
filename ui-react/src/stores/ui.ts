import { create } from 'zustand';
type ToastItem = { id: string; message: string; type: 'info' | 'success' | 'error' };
type UIState = { sidebarCollapsed: boolean; toasts: ToastItem[]; toggleSidebar: () => void; addToast: (message: string, type?: ToastItem['type']) => void; removeToast: (id: string) => void; };
export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toasts: [],
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  addToast: (message, type = 'info') => set((s) => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] })),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
