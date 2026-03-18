export type Generation =
  | 'Boomer' | 'Gen X' | 'Millennial'
  | 'Zillennial' | 'Gen Z' | 'Gen Alpha' | 'Synthetic';

export interface GenerationMeta {
  label:       Generation;
  display:     string;
  icon:        string;
  tier:        'millennial' | 'zillennial' | 'standard' | 'synthetic';
  accentColor: string;
  accentGlow:  string;
}

// Zillennial/Gen Z boundary: born on or before Sept 9, 2001 = Zillennial
const SPLIT = { year: 2001, month: 9, day: 9 };

export function getGeneration(
  birth_year?:  number | null,
  birth_month?: number | null,
  birth_day?:   number | null,
  is_agent?:    boolean,
): GenerationMeta | null {
  // Intercept FIRST — before any birth_year check
  if (is_agent)
    return { label:'Synthetic', display:'⚙ SYNTH', icon:'⚙', tier:'synthetic',
             accentColor:'#00FF41', accentGlow:'rgba(0,255,65,0.4)' };

  if (!birth_year) return null;

  if (birth_year < 1965)
    return { label:'Boomer',    display:'◉ BOOMER',     icon:'◉', tier:'standard',
             accentColor:'#F5A623', accentGlow:'rgba(245,166,35,0.35)' };
  if (birth_year <= 1980)
    return { label:'Gen X',     display:'▬ GEN X',      icon:'▬', tier:'standard',
             accentColor:'#9CA3AF', accentGlow:'rgba(156,163,175,0.2)' };
  if (birth_year <= 1996)
    return { label:'Millennial',display:'★ MILLENNIAL', icon:'★', tier:'millennial',
             accentColor:'#FFFFFF', accentGlow:'rgba(255,255,255,0.6)' };
  if (birth_year < SPLIT.year)
    return { label:'Zillennial',display:'✦ ZILLENNIAL', icon:'✦', tier:'zillennial',
             accentColor:'#C4B5FD', accentGlow:'rgba(196,181,253,0.45)' };

  if (birth_year === SPLIT.year) {
    // Default missing values to latest possible — biases toward Gen Z (conservative)
    const m = birth_month ?? 12;
    const d = birth_day   ?? 31;
    const isZillennial = m < SPLIT.month || (m === SPLIT.month && d <= SPLIT.day);
    if (isZillennial)
      return { label:'Zillennial',display:'✦ ZILLENNIAL', icon:'✦', tier:'zillennial',
               accentColor:'#C4B5FD', accentGlow:'rgba(196,181,253,0.45)' };
  }

  if (birth_year <= 2012)
    return { label:'Gen Z',     display:'◈ GEN Z',      icon:'◈', tier:'standard',
             accentColor:'#B4FF00', accentGlow:'rgba(180,255,0,0.35)' };

  return   { label:'Gen Alpha', display:'α GEN ALPHA',  icon:'α', tier:'standard',
             accentColor:'#C084FC', accentGlow:'rgba(192,132,252,0.35)' };
}
