export interface Remedy {
  id: number;
  disease: string;
  animal: string;
  symptoms: string;
  treatment: string;
  ingredients: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  relevantRemedies?: Remedy[];
  language?: 'en' | 'ta';
  isAiGenerated?: boolean;
}

export interface ChatResponse {
  answer: string;
  language: 'en' | 'ta';
  relevantRemedies: Remedy[];
  isAiGenerated: boolean;
  sessionId: string;
  detectedAnimal?: string;
}

