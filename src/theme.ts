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
  Fiction: '#5145e5',
  'Sci-Fi': '#0ea5b7',
  Fantasy: '#8b5cf6',
  Nonfiction: '#e0892f',
  'Self-help': '#21a366',
  Memoir: '#e85d8a',
};

export const statusColors: Record<string, string> = {
  unread: '#9aa0aa',
  reading: '#e0a020',
  finished: '#21a366',
};

export const statusLabels: Record<string, string> = {
  unread: 'Unread',
  reading: 'Reading',
  finished: 'Read',
};

export const shelves = ['Living room', 'Study', 'Bedroom', 'Kids room'];

export const buddyColors = ['#5145e5', '#0ea5b7', '#e0892f', '#8b5cf6', '#e85d8a'];

export function genreColor(genre?: string) {
  return genreColors[genre ?? ''] ?? genreColors.Fiction;
}
