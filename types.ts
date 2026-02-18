export interface ClockifyUser {
  id: string;
  email: string;
  name: string;
  activeWorkspace: string;
  defaultWorkspace: string;
}

export interface ClockifyProject {
  id: string;
  name: string;
  clientId?: string;
}

export interface ClockifyTimeEntry {
  id: string;
  description: string;
  timeInterval: {
    start: string;
    end: string | null;
    duration: string | null;
  };
  projectId?: string;
}

export interface DailyReportItem {
  date: string; // YYYY-MM-DD
  rawDescriptions: string[];
  finalDescription: string;
  totalHours: number;
}

export interface AppConfig {
  clockifyApiKey: string;
  contractorName: string;
  supervisorName: string;
  selectedProjectId?: string;
}