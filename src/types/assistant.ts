export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant' | 'system' | 'librarian';
  timestamp: Date;
  metadata?: {
    intent?: string;
    confidence?: number;
    requiresAction?: boolean;
    isOffline?: boolean;
    suggestedActions?: string[];
  };
}

export interface ConversationContext {
  conversationId: string;
  userId?: string;
  sessionStart: Date;
  lastInteraction: Date;
  conversationHistory: Message[];
  userPreferences?: {
    language?: string;
    preferredContact?: 'email' | 'sms';
  };
  currentState?: {
    activeReservation?: string;
    searchingForBook?: string;
    pendingAction?: string;
  };
}

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  entities: Record<string, string | string[]>;
  requiresContext?: boolean;
}

export interface AssistantResponse {
  reply: string;
  metadata: {
    intent: IntentType;
    confidence: number;
    requiresHuman: boolean;
    suggestedActions?: string[];
    dataSources?: string[];
    timestamp: Date;
  };
  contextUpdates?: Partial<ConversationContext>;
}

// 1. Create a runtime object with 'as const' to make properties read-only
export const IntentType = {
  GREETING: 'greeting',
  FAREWELL: 'farewell',
  HOURS: 'hours',
  AVAILABILITY: 'availability',
  RESERVATION: 'reservation',
  EXTENSION: 'extension',
  PENALTY: 'penalty',
  PROCEDURE: 'procedure',
  RULES: 'rules',
  CONTACT: 'contact',
  STATUS: 'status',
  COMPLEX: 'complex',
  UNKNOWN: 'unknown'
} as const;

// 2. Extract the union type from the object's values
export type IntentType = typeof IntentType[keyof typeof IntentType];
