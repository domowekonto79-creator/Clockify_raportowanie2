import { ClockifyUser, ClockifyTimeEntry } from '../types';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const API_BASE = 'https://api.clockify.me/api/v1';

export const validateClockifyKey = async (apiKey: string): Promise<ClockifyUser> => {
  const response = await fetch(`${API_BASE}/user`, {
    headers: {
      'X-Api-Key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error('Nieprawidłowy klucz API Clockify');
  }

  return response.json();
};

export const fetchCurrentMonthEntries = async (
  apiKey: string,
  workspaceId: string,
  userId: string
): Promise<ClockifyTimeEntry[]> => {
  const now = new Date();
  // Ensure we get the full range for the current month in UTC/ISO
  const start = startOfMonth(now).toISOString();
  const end = endOfMonth(now).toISOString();

  const response = await fetch(
    `${API_BASE}/workspaces/${workspaceId}/user/${userId}/time-entries?start=${start}&end=${end}&page-size=5000`,
    {
      headers: {
        'X-Api-Key': apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Błąd pobierania wpisów czasu');
  }

  return response.json();
};

// Helper to parse ISO duration (PT1H30M) to hours (float)
export const parseDuration = (durationStr: string | null): number => {
  if (!durationStr) return 0;
  // Simple regex parser for PT#H#M#S
  const hoursMatch = durationStr.match(/(\d+)H/);
  const minutesMatch = durationStr.match(/(\d+)M/);
  const secondsMatch = durationStr.match(/(\d+)S/);

  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  const seconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 0;

  return hours + minutes / 60 + seconds / 3600;
};