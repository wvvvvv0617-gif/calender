import { PresetBadgeTheme, ShiftRecord, Preset } from '../types';

export interface ColorPalette {
  id: PresetBadgeTheme;
  label: string;
  bg: string;
  text: string;
  border: string;
  borderLight: string;
  ring: string;
  cardBg: string;
  hex: string;
  softBgHex: string;
}

export const PRESET_COLOR_PALETTES: Record<PresetBadgeTheme, ColorPalette> = {
  blue: {
    id: 'blue',
    label: '클래식 블루',
    bg: 'bg-[#dbe1ff]',
    text: 'text-[#004ac6]',
    border: 'border-[#004ac6]',
    borderLight: 'border-[#004ac6]/30',
    ring: 'ring-[#004ac6]',
    cardBg: 'bg-[#eaedff]',
    hex: '#004ac6',
    softBgHex: '#dbe1ff',
  },
  purple: {
    id: 'purple',
    label: '연구원 바이올렛',
    bg: 'bg-[#eedcff]',
    text: 'text-[#7038a8]',
    border: 'border-[#7038a8]',
    borderLight: 'border-[#7038a8]/30',
    ring: 'ring-[#7038a8]',
    cardBg: 'bg-[#f7edff]',
    hex: '#7038a8',
    softBgHex: '#eedcff',
  },
  emerald: {
    id: 'emerald',
    label: '에메랄드 민트',
    bg: 'bg-[#6ffbbe]/35',
    text: 'text-[#00714d]',
    border: 'border-[#00714d]',
    borderLight: 'border-[#00714d]/30',
    ring: 'ring-[#00714d]',
    cardBg: 'bg-[#e6fbf2]',
    hex: '#00714d',
    softBgHex: '#bdf8dc',
  },
  amber: {
    id: 'amber',
    label: '앰버 오렌지',
    bg: 'bg-[#ffe0b2]',
    text: 'text-[#b45309]',
    border: 'border-[#b45309]',
    borderLight: 'border-[#b45309]/30',
    ring: 'ring-[#b45309]',
    cardBg: 'bg-[#fff5e6]',
    hex: '#b45309',
    softBgHex: '#ffe0b2',
  },
  rose: {
    id: 'rose',
    label: '로즈 코랄 (휴무)',
    bg: 'bg-[#ffdadb]',
    text: 'text-[#ad0033]',
    border: 'border-[#ad0033]',
    borderLight: 'border-[#ad0033]/30',
    ring: 'ring-[#ad0033]',
    cardBg: 'bg-[#fff0f2]',
    hex: '#ad0033',
    softBgHex: '#ffdadb',
  },
  teal: {
    id: 'teal',
    label: '청록 틸',
    bg: 'bg-[#ccfbf1]',
    text: 'text-[#0f766e]',
    border: 'border-[#0f766e]',
    borderLight: 'border-[#0f766e]/30',
    ring: 'ring-[#0f766e]',
    cardBg: 'bg-[#f0fdfa]',
    hex: '#0f766e',
    softBgHex: '#ccfbf1',
  },
  indigo: {
    id: 'indigo',
    label: '딥 인디고',
    bg: 'bg-[#e0e7ff]',
    text: 'text-[#3730a3]',
    border: 'border-[#3730a3]',
    borderLight: 'border-[#3730a3]/30',
    ring: 'ring-[#3730a3]',
    cardBg: 'bg-[#eef2ff]',
    hex: '#3730a3',
    softBgHex: '#e0e7ff',
  },
};

export const COLOR_THEME_KEYS: PresetBadgeTheme[] = [
  'blue',
  'purple',
  'emerald',
  'amber',
  'rose',
  'teal',
  'indigo',
];

/**
 * Resolves appropriate color palette for a shift record or preset
 */
export function getShiftColorPalette(
  shift?: ShiftRecord | null,
  presetMap?: Map<string, Preset>
): ColorPalette {
  if (!shift) {
    return PRESET_COLOR_PALETTES.blue;
  }

  if (shift.type === 'leave') {
    return PRESET_COLOR_PALETTES.rose;
  }

  if (shift.colorTheme && PRESET_COLOR_PALETTES[shift.colorTheme]) {
    return PRESET_COLOR_PALETTES[shift.colorTheme];
  }

  if (shift.badgeTheme && PRESET_COLOR_PALETTES[shift.badgeTheme]) {
    return PRESET_COLOR_PALETTES[shift.badgeTheme];
  }

  if (shift.presetId && presetMap) {
    const preset = presetMap.get(shift.presetId);
    if (preset) {
      const theme = preset.colorTheme || preset.badgeTheme;
      if (theme && PRESET_COLOR_PALETTES[theme]) {
        return PRESET_COLOR_PALETTES[theme];
      }
    }
  }

  // Fallback by name keywords
  const name = shift.name || '';
  if (name.includes('연구') || name.includes('실험') || name.includes('Lab')) {
    return PRESET_COLOR_PALETTES.purple;
  }
  if (name.includes('오픈')) {
    return PRESET_COLOR_PALETTES.emerald;
  }
  if (name.includes('미들') || name.includes('오후')) {
    return PRESET_COLOR_PALETTES.amber;
  }
  if (name.includes('마감') || name.includes('야간')) {
    return PRESET_COLOR_PALETTES.indigo;
  }
  if (name.includes('풀타임') || name.includes('종일')) {
    return PRESET_COLOR_PALETTES.teal;
  }

  return PRESET_COLOR_PALETTES.blue;
}
