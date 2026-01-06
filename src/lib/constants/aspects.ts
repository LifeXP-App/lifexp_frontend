import { AspectType } from '../types';

export const ASPECT_COLORS: Record<AspectType, { primary: string; secondary: string }> = {
  physique: { primary: '#8D2E2E', secondary: '#EAAFAF' },
  energy: { primary: '#c49352', secondary: '#FDF099' },
  logic: { primary: '#713599', secondary: '#BAAFEA' },
  creativity: { primary: '#4187A2', secondary: '#AFD9EA' },
  social: { primary: '#31784E', secondary: '#AFEAC7' }
};

export const MASTERY_COLORS = {
  Rookie: { primary: '#4168e2', secondary: '#4168e2' },
  Warrior: { primary: '#8D2E2E', secondary: '#EAAFAF' },
  Protagonist: { primary: '#c49352', secondary: '#FDF099' },
  Prodigy: { primary: '#713599', secondary: '#BAAFEA' },
  Alchemist: { primary: '#4187A2', secondary: '#AFD9EA' },
  Diplomat: { primary: '#31784E', secondary: '#AFEAC7' }
};
