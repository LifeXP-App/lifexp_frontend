import { UserProfile } from '../types';

export const mockUser: UserProfile = {
  id: '1',
  username: 'johndoe',
  avatar: undefined,
  totalXP: 15500,
  lifeLevel: 12,
  masteryTitle: 'Warrior',
  masteryLevel: 3,
  aspects: {
    physique: {
      id: 'physique',
      name: 'Physique',
      level: 8,
      currentXP: 12000,
      xpToNextLevel: 15000,
      icon: '🛡️'
    },
    energy: {
      id: 'energy',
      name: 'Energy',
      level: 6,
      currentXP: 8000,
      xpToNextLevel: 10000,
      icon: '⚡'
    },
    logic: {
      id: 'logic',
      name: 'Logic',
      level: 7,
      currentXP: 9500,
      xpToNextLevel: 12000,
      icon: '🧠'
    },
    creativity: {
      id: 'creativity',
      name: 'Creativity',
      level: 5,
      currentXP: 6000,
      xpToNextLevel: 8000,
      icon: '🎨'
    },
    social: {
      id: 'social',
      name: 'Social',
      level: 4,
      currentXP: 4500,
      xpToNextLevel: 6000,
      icon: '🤝'
    }
  }
};
