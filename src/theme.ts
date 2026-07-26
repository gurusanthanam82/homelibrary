export const colors = {
  bg: '#fffaf5',
  bgAlt: '#fffdf8',
  text: '#1b1714',
  textSoft: '#3a302a',
  textMuted: '#a79a8c',
  textFaint: '#c9bdb0',
  border: '#efe6dc',
  borderSoft: '#f4ece2',
  divider: '#f0ece5',
  chipBg: '#f6efe7',
  card: '#ffffff',

  maroon: '#7A2B45',
  maroonDark: '#5E1A31',
  coral: '#ff7a5c',
  coralStrong: '#ff5a3c',
  teal: '#0e8a8a',
  yellow: '#f4c542',
  purple: '#8b5cf6',

  pinkBg: '#F2D8DF',
  pinkBorder: '#ffd0c4',

  dark: '#1b1714',
  white: '#ffffff',

  success: '#0e8a8a',
  danger: '#7A2B45',
};

export const radii = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 22,
  pill: 999,
  sheet: 26,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const fonts = {
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  bold: 'SpaceGrotesk_700Bold',
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
};

export const genreColors: Record<string, string> = {
  Fiction: '#7A2B45',
  'Sci-Fi': '#0e8a8a',
  Fantasy: '#8b5cf6',
  History: '#c98a2b',
  Biography: '#3b6ea5',
  'Self-Help': '#2bb38a',
  Romance: '#e0662f',
  Thriller: '#4a4a4a',
  Other: '#8c8378',
};

export const statusColors: Record<string, string> = {
  owned: '#7A2B45',
  reading: '#0e8a8a',
  finished: '#3b6ea5',
  wishlist: '#c98a2b',
};

export const buddyColors = ['#7A2B45', '#0e8a8a', '#f4c542', '#8b5cf6', '#e0662f', '#3b6ea5'];

export function genreColor(genre?: string) {
  return genreColors[genre ?? ''] ?? genreColors.Other;
}
