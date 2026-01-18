export interface Request {
  id: number;
  username: string;
  request: string;
  message?: string;
  played: boolean;
  notes?: string;
  platform: 'twitch' | 'youtube' | 'manual' | 'mobile' | 'restream';
  timestamp?: number;
}

export interface CurrentRequester {
  username: string;
  requestId: number;
  timestamp: number;
}

export interface FirebaseConfig {
  apiKey: string;
  projectId: string;
  databaseURL: string;
}
