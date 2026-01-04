
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations } from './locales';

export type Language = 'es' | 'en';

interface LanguageState {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof typeof translations['es']) => string;
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set, get) => ({
            language: 'es', // Default Spanish
            setLanguage: (lang) => set({ language: lang }),
            t: (key) => {
                const lang = get().language;
                return translations[lang][key] || key;
            }
        }),
        {
            name: 'buzz-language-storage',
            partialize: (state) => ({ language: state.language }),
        }
    )
);
