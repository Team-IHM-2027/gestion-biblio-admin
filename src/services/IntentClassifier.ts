// client-app/src/services/IntentClassifier.ts

import type { IntentResult } from "../types/assistant";
import { IntentType } from "../types/assistant";

export class IntentClassifier {
  private greetingPatterns = [
    /^hi|hello|hey/i,
    /^good (morning|afternoon|evening)/i,
    /^greetings/i
  ];

  private intentPatterns: Map<IntentType, RegExp[]> = new Map([
    [IntentType.HOURS, [
      /open.*hour|hour.*open|closing.*time|opening.*time/i,
      /what.*time.*open|when.*close/i,
      /schedule.*library|library.*schedule/i
    ]],
    [IntentType.AVAILABILITY, [
      /available.*book|book.*available/i,
      /do you have.*book|find.*book/i,
      /search.*for.*book|looking for.*book/i,
      /is.*available|check.*availability/i
    ]],
    [IntentType.RESERVATION, [
      /reserve.*book|book.*reservation/i,
      /hold.*book|place.*hold/i,
      /how.*reserve|make.*reservation/i
    ]],
    [IntentType.EXTENSION, [
      /extend.*loan|renew.*book/i,
      /more.*time.*book|longer.*keep/i
    ]],
    [IntentType.PENALTY, [
      /late.*fee|fine.*late/i,
      /penalty.*book|overdue.*charge/i
    ]],
    [IntentType.RULES, [
      /rule.*library|library.*rule/i,
      /policy.*borrow|borrowing.*policy/i,
      /how many.*borrow|limit.*book/i
    ]],
    [IntentType.PROCEDURE, [
      /how.*borrow|borrow.*book/i,
      /process.*return|return.*book/i,
      /sign.*up.*library|get.*card/i
    ]],
    [IntentType.STATUS, [
      /status.*reservation|my.*reservation/i,
      /when.*due|due.*date/i,
      /check.*my.*book/i
    ]],
    [IntentType.CONTACT, [
      /contact.*librarian|speak.*human/i,
      /phone.*number|email.*address/i
    ]],
    [IntentType.FAREWELL, [
      /bye|goodbye|see you|thanks|thank you/i
    ]]
  ]);

  async classifyIntent(message: string): Promise<IntentResult> {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Check for greetings first
    if (this.greetingPatterns.some(pattern => pattern.test(normalizedMessage))) {
      return {
        intent: IntentType.GREETING,
        confidence: 0.95,
        entities: {}
      };
    }

    // Check each intent category
    let bestMatch: IntentResult = {
      intent: IntentType.UNKNOWN,
      confidence: 0,
      entities: {}
    };

    for (const [intent, patterns] of this.intentPatterns) {
      const matchingPatterns = patterns.filter(pattern => pattern.test(normalizedMessage));
      if (matchingPatterns.length > 0) {
        const confidence = this.calculateConfidence(normalizedMessage, matchingPatterns);
        const entities = this.extractEntities(normalizedMessage, intent);
        
        if (confidence > bestMatch.confidence) {
          bestMatch = { intent, confidence, entities };
        }
      }
    }

    // Extract entities even for unknown intents
    if (bestMatch.intent === IntentType.UNKNOWN) {
      bestMatch.entities = this.extractGenericEntities(normalizedMessage);
    }

    return bestMatch;
  }

  private calculateConfidence(message: string, patterns: RegExp[]): number {
    // Simple confidence calculation based on pattern matches
    const baseConfidence = Math.min(0.8, patterns.length * 0.3);
    
    // Boost confidence for exact matches
    const exactMatches = patterns.filter(p => {
      const match = message.match(p);
      return match && match[0]?.length === message.length;
    });
    
    return exactMatches.length > 0 ? 0.9 : baseConfidence;
  }

  private extractEntities(message: string, intent: IntentType): Record<string, string> {
    const entities: Record<string, string> = {};
    
    switch (intent) {
      case IntentType.AVAILABILITY:
        const bookMatch = message.match(/"([^"]+)"|book titled ([^"]+)|'([^']+)'/);
        if (bookMatch) {
          entities.bookTitle = bookMatch[1] || bookMatch[2] || bookMatch[3];
        }
        break;
        
      case IntentType.EXTENSION:
        const dateMatch = message.match(/(\d{1,2}\/\d{1,2}\/\d{4})|(tomorrow|next week)/i);
        if (dateMatch) {
          entities.dueDate = dateMatch[0];
        }
        break;
    }
    
    return entities;
  }

  private extractGenericEntities(message: string): Record<string, string> {
    const entities: Record<string, string> = {};
    
    // Extract potential book titles in quotes
    const quotedMatch = message.match(/"([^"]+)"/);
    if (quotedMatch) {
      entities.possibleTitle = quotedMatch[1];
    }
    
    return entities;
  }
}

export { IntentType, type IntentResult };
