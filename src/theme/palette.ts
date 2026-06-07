export type Variant = 'light' | 'dark';

export interface Palette {
  name: string;
  appBg: string;
  appBg2: string;
  surface: string;
  surfaceAlt: string;
  line: string;
  line2: string;
  ink: string;
  ink2: string;
  muted: string;
  brown: string;
  olive: string;
  gold: string;
  goldSoft: string;
  blue: string;
  blueSoft: string;
  danger: string;
  dangerSoft: string;
  ok: string;
  okSoft: string;
  cardInk: string;
  tabBg: string;
}

export const SC_PALETTES: Record<Variant, Palette> = {
  light: {
    name: 'Crème',
    appBg: '#ECE8E0',
    appBg2: '#F4F1EB',
    surface: '#FBF9F5',
    surfaceAlt: '#F1EDE4',
    line: 'rgba(43,42,38,0.12)',
    line2: 'rgba(43,42,38,0.06)',
    ink: '#2B2A26',
    ink2: '#54514A',
    muted: '#837E74',
    brown: '#8B6B4A',
    olive: '#7C8458',
    gold: '#C99B5B',
    goldSoft: '#E7CF9E',
    blue: '#5E84A8',
    blueSoft: '#BFD4E8',
    danger: '#B4533B',
    dangerSoft: '#F0D9CF',
    ok: '#5E7B49',
    okSoft: '#DDE6CF',
    cardInk: '#F5ECDD',
    tabBg: 'rgba(251,249,245,0.97)',
  },
  dark: {
    name: 'Nuit',
    appBg: '#1C1A16',
    appBg2: '#232019',
    surface: '#2A2620',
    surfaceAlt: '#322D25',
    line: 'rgba(245,236,221,0.12)',
    line2: 'rgba(245,236,221,0.06)',
    ink: '#F3EEE3',
    ink2: 'rgba(243,238,227,0.74)',
    muted: 'rgba(243,238,227,0.5)',
    brown: '#B98C57',
    olive: '#9AA36C',
    gold: '#E2BD7C',
    goldSoft: '#3a3322',
    blue: '#8FB4D6',
    blueSoft: '#27313a',
    danger: '#E08766',
    dangerSoft: '#3a2620',
    ok: '#9DBE79',
    okSoft: '#28311d',
    cardInk: '#FBF3E4',
    tabBg: 'rgba(34,31,25,0.97)',
  },
};

export function scPalette(variant: Variant): Palette {
  return SC_PALETTES[variant];
}

// Card gradient colors (approximated for React Native LinearGradient)
export const CARD_GRAD_COLORS = {
  light: ['#9a7850', '#7d5f3f', '#5f4730'] as const,
  dark: ['#b08a57', '#8a6a44', '#4f3d28'] as const,
};
