import { fetchOrgConfiguration } from './configService';
import type { OrgSettings, Contact, OpeningHours } from '../types/orgSettings';

export class AssistantService {
  async getLibraryInfo(orgName: string = 'OrgSettings') {
    const config = await fetchOrgConfiguration(orgName);
    
    return {
      name: config.Name,
      address: config.Address,
      contact: config.Contact,
      openingHours: config.OpeningHours,
      borrowingRules: {
        maxLoans: config.MaximumSimultaneousLoans,
        specificRules: config.SpecificBorrowingRules || [],
        latePenalties: config.LateReturnPenalties || [],
      },
      logo: config.Logo,
      theme: config.Theme,
    };
  }

  async processQuery(query: string, orgName: string = 'OrgSettings'): Promise<string> {
    const config = await fetchOrgConfiguration(orgName);
    const normalizedQuery = query.toLowerCase().trim();
    
    // Intent detection
    if (this.containsAny(normalizedQuery, ['bonjour', 'salut', 'hello', 'hey', 'coucou'])) {
      return this.generateGreeting(config);
    }
    
    if (this.containsAny(normalizedQuery, ['heure', 'horaires', 'ouvert', 'fermé', 'ouverture', 'fermeture'])) {
      return this.formatOpeningHours(config.OpeningHours, config.Name);
    }
    
    if (this.containsAny(normalizedQuery, ['règle', 'règlement', 'politique', 'emprunt', 'prêt'])) {
      return this.formatBorrowingRules(config);
    }
    
    if (this.containsAny(normalizedQuery, ['contact', 'email', 'téléphone', 'tél', 'phone', 'whatsapp', 'facebook', 'instagram'])) {
      return this.formatContactInfo(config.Contact, config.Name);
    }
    
    if (this.containsAny(normalizedQuery, ['adresse', 'localisation', 'où', 'trouver', 'lieu'])) {
      return this.formatAddress(config.Address, config.Name);
    }
    
    if (this.containsAny(normalizedQuery, ['réserver', 'réservation', 'booking', 'hold'])) {
      return this.formatReservationInfo(config);
    }
    
    if (this.containsAny(normalizedQuery, ['amende', 'pénalité', 'retard', 'late', 'fine'])) {
      return this.formatLatePenalties(config);
    }
    
    if (this.containsAny(normalizedQuery, ['prolonger', 'renouveler', 'extension'])) {
      return this.formatRenewalInfo();
    }
    
    if (this.containsAny(normalizedQuery, ['livre', 'document', 'titre', 'auteur'])) {
      return "Pour rechercher un livre spécifique, veuillez me fournir le titre ou le nom de l'auteur.";
    }
    
    if (this.containsAny(normalizedQuery, ['merci', 'remerci', 'gratitude'])) {
      return "Je vous en prie! N'hésitez pas si vous avez d'autres questions.";
    }
    
    // Default response
    return this.generateDefaultResponse(config, query);
  }

  getQuickSuggestions(orgName: string = 'OrgSettings') {
    // These can be dynamic based on configuration
    return [
      { text: "📅 Horaires", query: "Quels sont les horaires d'ouverture ?" },
      { text: "📚 Règles", query: "Quelles sont les règles d'emprunt ?" },
      { text: "📞 Contact", query: "Comment contacter la bibliothèque ?" },
      { text: "📍 Adresse", query: "Où se trouve la bibliothèque ?" },
      { text: "🔖 Réserver", query: "Comment réserver un livre ?" },
      { text: "⚠️ Amendes", query: "Quelles sont les pénalités pour retard ?" },
    ];
  }

  private containsAny(query: string, keywords: string[]): boolean {
    return keywords.some(keyword => query.includes(keyword));
  }

  private generateGreeting(config: OrgSettings): string {
    return `Bonjour! Bienvenue à la bibliothèque ${config.Name}. Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?`;
  }

  private formatOpeningHours(hours: OpeningHours, libraryName: string): string {
    const days = [
      { name: 'Lundi', hours: hours.Monday, closed: hours.Monday === 'Fermé' || !hours.Monday },
      { name: 'Mardi', hours: hours.Tuesday, closed: hours.Tuesday === 'Fermé' || !hours.Tuesday },
      { name: 'Mercredi', hours: hours.Wednesday, closed: hours.Wednesday === 'Fermé' || !hours.Wednesday },
      { name: 'Jeudi', hours: hours.Thursday, closed: hours.Thursday === 'Fermé' || !hours.Thursday },
      { name: 'Vendredi', hours: hours.Friday, closed: hours.Friday === 'Fermé' || !hours.Friday },
      { name: 'Samedi', hours: hours.Saturday, closed: hours.Saturday === 'Fermé' || !hours.Saturday },
      { name: 'Dimanche', hours: hours.Sunday, closed: hours.Sunday === 'Fermé' || !hours.Sunday }
    ];

    const openDays = days.filter(day => !day.closed);
    const closedDays = days.filter(day => day.closed);

    let response = `🕐 Horaires d'ouverture de ${libraryName}:\n\n`;
    
    if (openDays.length > 0) {
      response += "📅 Jours d'ouverture:\n";
      openDays.forEach(day => {
        response += `• ${day.name}: ${day.hours}\n`;
      });
    }
    
    if (closedDays.length > 0) {
      response += "\n🚫 Jours de fermeture:\n";
      closedDays.forEach(day => {
        response += `• ${day.name}: Fermé\n`;
      });
    }

    return response;
  }

  private formatBorrowingRules(config: OrgSettings): string {
    let response = `📚 Règles d'emprunt de ${config.Name}:\n\n`;
    
    response += `• Nombre maximum d'emprunts simultanés: ${config.MaximumSimultaneousLoans}\n`;
    
    if (config.SpecificBorrowingRules && config.SpecificBorrowingRules.length > 0) {
      response += "\nRègles spécifiques:\n";
      config.SpecificBorrowingRules.forEach(rule => {
        response += `• ${rule}\n`;
      });
    }
    
    if (config.LateReturnPenalties && config.LateReturnPenalties.length > 0) {
      response += "\n⚠️ Pénalités pour retard:\n";
      config.LateReturnPenalties.forEach(penalty => {
        response += `• ${penalty}\n`;
      });
    }
    
    return response;
  }

  private formatContactInfo(contact: Contact, libraryName: string): string {
    let response = `📞 Contacts de ${libraryName}:\n\n`;
    
    if (contact.Phone) response += `• Téléphone: ${contact.Phone}\n`;
    if (contact.Email) response += `• Email: ${contact.Email}\n`;
    if (contact.WhatsApp) response += `• WhatsApp: ${contact.WhatsApp}\n`;
    if (contact.Facebook) response += `• Facebook: ${contact.Facebook}\n`;
    if (contact.Instagram) response += `• Instagram: ${contact.Instagram}\n`;
    
    return response;
  }

  private formatAddress(address: string, libraryName: string): string {
    return `📍 ${libraryName}\nAdresse: ${address}`;
  }

  private formatReservationInfo(config: OrgSettings): string {
    let response = "🔖 Procédures de réservation:\n\n";
    response += "1. Connectez-vous à votre compte en ligne\n";
    response += "2. Recherchez le livre souhaité\n";
    response += "3. Cliquez sur 'Réserver'\n";
    response += "4. Choisissez la date de retrait\n";
    response += "5. Confirmez la réservation\n\n";
    response += `ℹ️ Vous pouvez réserver jusqu'à ${config.MaximumSimultaneousLoans} livres simultanément.`;
    
    return response;
  }

  private formatLatePenalties(config: OrgSettings): string {
    if (!config.LateReturnPenalties || config.LateReturnPenalties.length === 0) {
      return "Les informations sur les pénalités pour retard ne sont pas encore configurées.";
    }
    
    let response = "⚠️ Pénalités pour retard:\n\n";
    config.LateReturnPenalties.forEach(penalty => {
      response += `• ${penalty}\n`;
    });
    
    return response;
  }

  private formatRenewalInfo(): string {
    return "🔄 Prolongation d'emprunt:\n\n1. Connectez-vous à votre compte\n2. Allez dans 'Mes emprunts'\n3. Sélectionnez le livre à prolonger\n4. Cliquez sur 'Prolonger'\n\nℹ️ La prolongation n'est possible que si le livre n'est pas réservé par un autre lecteur.";
  }

  private generateDefaultResponse(config: OrgSettings, originalQuery: string): string {
    return `Je comprends que vous demandez: "${originalQuery}"\n\nÀ la bibliothèque ${config.Name}, je peux vous aider avec:\n\n• 📅 Les horaires d'ouverture\n• 📚 Les règles d'emprunt\n• 📞 Les informations de contact\n• 📍 L'adresse de la bibliothèque\n• 🔖 Les procédures de réservation\n• ⚠️ Les pénalités pour retard\n\nPouvez-vous préciser votre question ou choisir l'une de ces catégories ?`;
  }
}