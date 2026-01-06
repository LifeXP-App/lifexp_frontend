'use client';

import { useState, useEffect } from 'react';
import { mockUser } from '../mock/userData';
import { UserProfile } from '../types';

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUser(mockUser);
      setLoading(false);
    }, 300);
  }, []);

  return { user, loading };
}
