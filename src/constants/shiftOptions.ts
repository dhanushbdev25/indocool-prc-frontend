export const SHIFT_OPTION_VALUES = ['Shift A', 'Shift B', 'Shift C', 'Shift G'] as const;

export type ShiftOptionValue = (typeof SHIFT_OPTION_VALUES)[number];
