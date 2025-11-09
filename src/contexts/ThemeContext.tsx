import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  hasExplicitPreference: boolean;
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'roomio-theme';
const MEDIA_QUERY = '(prefers-color-scheme: dark)';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getInitialThemeState = (): ThemeState => {
  if (typeof window === 'undefined') {
    return { theme: 'light', hasExplicitPreference: false };
  }

  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === 'light' || stored === 'dark') {
    return { theme: stored, hasExplicitPreference: true };
  }

  const prefersDark = window.matchMedia(MEDIA_QUERY).matches;
  return { theme: prefersDark ? 'dark' : 'light', hasExplicitPreference: false };
};

const applyTheme = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === 'dark');
  root.style.setProperty('color-scheme', theme === 'dark' ? 'dark' : 'light');
};

const enableThemeTransition = () => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.add('theme-transition');
  window.setTimeout(() => {
    root.classList.remove('theme-transition');
  }, 220);
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ThemeState>(() => getInitialThemeState());

  useLayoutEffect(() => {
    applyTheme(state.theme);
  }, [state.theme]);

  useEffect(() => {
    if (state.hasExplicitPreference || typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setState((prev) => ({
        ...prev,
        theme: event.matches ? 'dark' : 'light',
      }));
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [state.hasExplicitPreference]);

  const setTheme = useCallback((theme: Theme) => {
    setState({ theme, hasExplicitPreference: true });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
    enableThemeTransition();
  }, []);

  const toggleTheme = useCallback(() => {
    setState((prev) => {
      const next = prev.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
      enableThemeTransition();
      return { theme: next, hasExplicitPreference: true };
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: state.theme,
      setTheme,
      toggleTheme,
    }),
    [state.theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
