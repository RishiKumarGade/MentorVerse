import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Theme, LearningSession, User, Doubt, AvatarState } from '@/types';

// Default fallback images for all themes
const DEFAULT_AVATAR_IMAGES = {
  loading: '/default-avatar-loading.svg',
  explaining: '/default-avatar-explaining.svg',
  asking: '/default-avatar-asking.svg',
  praising: '/default-avatar-praising.svg',
  consoling: '/default-avatar-consoling.svg',
};

// Helper function to get avatar image with proper fallback
function getAvatarImage(theme: Theme, state: keyof typeof DEFAULT_AVATAR_IMAGES): string {
  // First try theme-specific image
  if (theme.images[state]) {
    return theme.images[state];
  }
  
  // Then try default fallback image
  if (DEFAULT_AVATAR_IMAGES[state]) {
    return DEFAULT_AVATAR_IMAGES[state];
  }
  
  // Final fallback - return a data URL or placeholder
  return '/default-avatar-loading.svg';
}

// Default themes
const defaultThemes: Theme[] = [
  {
    id: 'batman',
    name: 'batman',
    displayName: 'Batman',
    description: 'Learn with the Dark Knight',
    images: {
      loading: '/themes/batman/loading.svg',
      explaining: '/themes/batman/explaining.svg',
      asking: '/themes/batman/asking.svg',
      praising: '/themes/batman/praising.svg',
      consoling: '/themes/batman/consoling.svg',
    },
    audio: '/themes/batman/focus.mp3',
    colors: {
      primary: '#1a1a1a',
      secondary: '#ffd700',
      accent: '#0066cc',
    },
  },
  {
    id: 'naruto',
    name: 'naruto',
    displayName: 'Naruto',
    description: 'Train like a ninja!',
    images: {
      loading: '/themes/naruto/loading.png',
      explaining: '/themes/naruto/explaining.png',
      asking: '/themes/naruto/asking.png',
      praising: '/themes/naruto/praising.png',
      consoling: '/themes/naruto/consoling.png',
    },
    audio: '/themes/naruto/focus.mp3',
    colors: {
      primary: '#ff6b35',
      secondary: '#0066cc',
      accent: '#ffd700',
    },
  },
  {
    id: 'minimal',
    name: 'minimal',
    displayName: 'Minimal',
    description: 'Clean and focused learning',
    images: {},
    colors: {
      primary: '#374151',
      secondary: '#6366f1',
      accent: '#10b981',
    },
  },
];

interface AppState {
  // User and Authentication
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Theme Management
  currentTheme: Theme;
  availableThemes: Theme[];
  setTheme: (theme: Theme) => void;
  
  // Learning Session
  currentSession: LearningSession | null;
  setCurrentSession: (session: LearningSession | null) => void;
  
  // Avatar State
  avatarState: AvatarState;
  setAvatarState: (state: AvatarState) => void;
  
  // Audio
  isAudioEnabled: boolean;
  toggleAudio: () => void;
  
  // Loading and Errors
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Doubts (ephemeral)
  currentDoubts: Doubt[];
  addDoubt: (doubt: Doubt) => void;
  removeDoubt: (doubtId: string) => void;
  clearDoubts: () => void;
}

export const useStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // User and Authentication
        user: null,
        setUser: (user) => set({ user }),
        
        // Theme Management
        currentTheme: defaultThemes[0], // Batman as default
        availableThemes: defaultThemes,
        setTheme: (theme) => set({ currentTheme: theme }),
        
        // Learning Session
        currentSession: null,
        setCurrentSession: (session) => set({ currentSession: session }),
        
        // Avatar State
        avatarState: 'loading',
        setAvatarState: (state) => set({ avatarState: state }),
        
        // Audio
        isAudioEnabled: true,
        toggleAudio: () => set((state) => ({ isAudioEnabled: !state.isAudioEnabled })),
        
        // Loading and Errors
        isLoading: false,
        error: null,
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        
        // Doubts (ephemeral - not persisted)
        currentDoubts: [],
        addDoubt: (doubt) => 
          set((state) => ({ 
            currentDoubts: [...state.currentDoubts, doubt] 
          })),
        removeDoubt: (doubtId) =>
          set((state) => ({
            currentDoubts: state.currentDoubts.filter((doubt) => doubt.id !== doubtId)
          })),
        clearDoubts: () => set({ currentDoubts: [] }),
      }),
      {
        name: 'aitutor-storage',
        partialize: (state) => ({
          // Only persist these properties
          currentTheme: state.currentTheme,
          isAudioEnabled: state.isAudioEnabled,
        }),
      }
    ),
    { name: 'aitutor-store' }
  )
);

// Helper functions
export { getAvatarImage };
export { DEFAULT_AVATAR_IMAGES };

// Selector hooks for better performance
export const useUser = () => useStore((state) => state.user);
export const useTheme = () => useStore((state) => state.currentTheme);
export const useSession = () => useStore((state) => state.currentSession);
export const useAvatarState = () => useStore((state) => state.avatarState);
export const useAudio = () => useStore((state) => state.isAudioEnabled);
export const useLoading = () => useStore((state) => state.isLoading);
export const useError = () => useStore((state) => state.error);
export const useDoubts = () => useStore((state) => state.currentDoubts);
