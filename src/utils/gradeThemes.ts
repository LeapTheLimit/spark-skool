type GradeTheme = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
};

const themes: Record<string, GradeTheme> = {
  elementary: {
    primary: 'bg-gradient-to-r from-orange-400 to-pink-400',
    secondary: 'bg-gradient-to-r from-purple-400 to-pink-300',
    accent: 'text-orange-600',
    background: 'bg-gradient-to-b from-orange-50 to-pink-50',
    card: 'bg-white hover:bg-orange-50'
  },
  middle: {
    primary: 'bg-gradient-to-r from-blue-400 to-indigo-400',
    secondary: 'bg-gradient-to-r from-cyan-400 to-blue-300',
    accent: 'text-blue-600',
    background: 'bg-gradient-to-b from-blue-50 to-indigo-50',
    card: 'bg-white hover:bg-blue-50'
  },
  high: {
    primary: 'bg-gradient-to-r from-emerald-400 to-teal-400',
    secondary: 'bg-gradient-to-r from-teal-400 to-emerald-300',
    accent: 'text-emerald-600',
    background: 'bg-gradient-to-b from-emerald-50 to-teal-50',
    card: 'bg-white hover:bg-emerald-50'
  }
};

export function getGradeTheme(grade: number): GradeTheme {
  if (grade <= 5) return themes.elementary;
  if (grade <= 8) return themes.middle;
  return themes.high;
} 