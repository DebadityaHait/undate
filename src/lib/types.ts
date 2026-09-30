export interface PersonInput {
  id: string;
  name: string;
  age: number;
  gender: string;
  location: string;
  occupation: string;
  linkedinUrl: string;
  instagramUrl: string;
  linkedinBio?: string;
  instagramBio?: string;
  avatarColor?: string;
}

export interface Evidence {
  tag: string;
  source: 'linkedin' | 'instagram';
  quote: string;
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
  evidence: Evidence[];
  confidence: number;
  aiEnhanced?: boolean;
}

export interface ChatMessage {
  from: string;
  fromName: string;
  text: string;
  thinking?: string;
  ts: number;
}

export type DateStatus = 'first' | 'finalist' | 'introduced' | 'passed';

export interface DateResult {
  id: string;
  aId: string;
  bId: string;
  /** mutual score (avg of directional) — drives rankings */
  score: number;
  /** how much A likes B */
  scoreAB: number;
  /** how much B likes A */
  scoreBA: number;
  chemistry: number;
  valuesFit: number;
  lifestyleFit: number;
  verdict: string;
  asymmetry: string;
  highlights: string[];
  frictions: string[];
  transcript: ChatMessage[];
  status: DateStatus;
  round2?: ChatMessage[];
  round2Verdict?: string;
}

export interface Introduction {
  aId: string;
  bId: string;
  score: number;
  dateId: string;
  note: string;
}

export interface RankEntry {
  personId: string;
  score: number;
  reason: string;
  dateId: string;
  mutual?: boolean;
}
