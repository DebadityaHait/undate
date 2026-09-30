export interface PersonInput {
  id: string;
  name: string;
  age: number;
  gender: string;
  location: string;
  occupation: string;
  linkedinUrl: string;
  instagramUrl: string;
  linkedinBio?: string; // cached headline/about
  instagramBio?: string; // cached bio
  avatarColor?: string;
}

export interface AgentProfile {
  personId: string;
  tagline: string;
  needs: string[];
  hobbies: string[];
  interests: string[];
  values: string[];
  lifestyle: string[];
  personality: string[];
  loveLanguage: string;
  attachmentStyle: string;
  idealMatch: string;
  dealbreakers: string[];
  dateIdeas: string[];
  linkedinSignals: string[];
  instagramSignals: string[];
  confidence: number;
}

export interface ChatMessage {
  from: string; // personId or 'system'
  fromName: string;
  text: string;
  thinking?: string;
  ts: number;
}

export interface DateResult {
  id: string;
  aId: string;
  bId: string;
  score: number; // 0-100
  chemistry: number;
  valuesFit: number;
  lifestyleFit: number;
  verdict: string;
  highlights: string[];
  frictions: string[];
  transcript: ChatMessage[];
}

export interface RankEntry {
  personId: string;
  score: number;
  reason: string;
  dateId: string;
}
