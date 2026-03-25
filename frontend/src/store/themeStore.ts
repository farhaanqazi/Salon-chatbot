import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PaletteMode } from '@mui/material';

interface ThemeStore {
  mode: PaletteMode;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: 'dark',
      toggleMode: () => set((state) => ({ mode: state.mode === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'theme-storage' }
  )
);
