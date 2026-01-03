import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { OrgSettings, Contact, OpeningHours, Theme } from '../../types/orgSettings';
import { defaultOrgSettings } from '../../constants/defaultOrgSettings';

export class LibrarianApi {
  private baseURL: string;
  private headers: HeadersInit;
  private cachedOrgSettings: OrgSettings | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  constructor() {
    this.baseURL = import.meta.env.VITE_ASSISTANT_API_URL || 'http://localhost:3000';
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  // ==================== FIREBASE CONFIG INTEGRATION ====================

  /**
   * Fetches organization configuration with caching
   */
  async fetchOrgConfiguration(orgName: string = 'OrgSettings'): Promise<OrgSettings> {
    try {
      // Check cache first
      const now = Date.now();
      if (this.cachedOrgSettings && now < this.cacheExpiry) {
        console.log('Using cached org settings');
        return this.cachedOrgSettings;
      }

      console.log(`Fetching configuration for organization: ${orgName}`);

      // Try to get configuration
      const configRef = doc(db, 'Configuration', orgName);
      const configSnap = await getDoc(configRef);

      let settings: OrgSettings;
      
      if (configSnap.exists()) {
        console.log(`Found configuration for ${orgName}`);
        const data = configSnap.data();
        settings = this.mergeWithDefaults(data as Partial<OrgSettings>);
      } else {
        console.log('No configuration found, using defaults');
        settings = defaultOrgSettings;
      }

      // Cache the settings
      this.cachedOrgSettings = settings;
      this.cacheExpiry = now + this.CACHE_DURATION;

      return settings;
    } catch (error) {
      console.error('Error fetching organization configuration:', error);
      return defaultOrgSettings;
    }
  }

  /**
   * Gets library hours from configuration
   */
  async getLibraryHours(): Promise<string> {
    const config = await this.fetchOrgConfiguration();
    
    const hours = config.OpeningHours;
    const days = [
      { name: 'Lundi', hours: hours.Monday, closed: hours.Monday === 'Fermé' || !hours.Monday },
      { name: 'Mardi', hours: hours.Tuesday, closed: hours.Tuesday === 'Fermé' || !hours.Tuesday },
      { name: 'Mercredi', hours: hours.Wednesday, closed: hours.Wednesday === 'Fermé' || !hours.Wednesday },
      { name: 'Jeudi', hours: hours.Thursday, closed: hours.Thursday === 'Fermé' || !hours.Thursday },
      { name: 'Vendredi', hours: hours.Friday, closed: hours.Friday === 'Fermé' || !hours.Friday },
      { name: 'Samedi', hours: hours.Saturday, closed: hours.Saturday === 'Fermé' || !hours.Saturday },
      { name: 'Dimanche', hours: hours.Sunday, closed: hours.Sunday === 'Fermé' || !hours.Sunday }
    ];

    // Format open days
    const openDays = days
      .filter(day => !day.closed)
      .map(day => `${day.name}: ${day.hours}`);
    
    // Format closed days
    const closedDays = days
      .filter(day => day.closed)
      .map(day => `${day.name}: Fermé`);

    const allDays = [...openDays, ...closedDays].join('\n');
    
    return allDays || "Les horaires ne sont pas encore configurés. Veuillez contacter la bibliothèque pour plus d'informations.";
  }

  /**
   * Gets borrowing rules from configuration
   */
  async getBorrowingRules(): Promise<string> {
    const config = await this.fetchOrgConfiguration();
    
    const rules: string[] = [];
    
    // Basic library info
    rules.push(`Bibliothèque: ${config.Name}`);
    if (config.Address) {
      rules.push(`Adresse: ${config.Address}`);
    }
    
    // Borrowing limits
    rules.push(`\n📚 Règles d'emprunt:`);
    rules.push(`• Nombre maximum d'emprunts simultanés: ${config.MaximumSimultaneousLoans}`);
    
    // Specific borrowing rules
    if (config.SpecificBorrowingRules && config.SpecificBorrowingRules.length > 0) {
      config.SpecificBorrowingRules.forEach(rule => {
        rules.push(`• ${rule}`);
      });
    }
    
    // Late return penalties
    if (config.LateReturnPenalties && config.LateReturnPenalties.length > 0) {
      rules.push("\n⚠️ Pénalités pour retard:");
      config.LateReturnPenalties.forEach(penalty => {
        rules.push(`• ${penalty}`);
      });
    }
    
    return rules.join('\n');
  }

  /**
   * Gets contact information from configuration
   */
  async getContactInfo(): Promise<string> {
    const config = await this.fetchOrgConfiguration();
    
    const contact = config.Contact;
    const contactInfo: string[] = [];
    
    contactInfo.push(`📞 Contacts de la bibliothèque ${config.Name}:`);
    
    if (contact.Phone) contactInfo.push(`Téléphone: ${contact.Phone}`);
    if (contact.Email) contactInfo.push(`Email: ${contact.Email}`);
    if (contact.WhatsApp) contactInfo.push(`WhatsApp: ${contact.WhatsApp}`);
    if (contact.Facebook) contactInfo.push(`Facebook: ${contact.Facebook}`);
    if (contact.Instagram) contactInfo.push(`Instagram: ${contact.Instagram}`);
    
    if (config.Address) {
      contactInfo.push(`\n📍 Adresse: ${config.Address}`);
    }
    
    return contactInfo.join('\n');
  }

  /**
   * Gets reservation procedures from configuration
   */
  async getReservationProcedures(): Promise<string> {
    const config = await this.fetchOrgConfiguration();
    
    const procedures: string[] = [];
    
    procedures.push(`📋 Procédures de réservation à ${config.Name}:`);
    procedures.push(`1. Recherchez le livre dans notre catalogue en ligne`);
    procedures.push(`2. Cliquez sur "Réserver" sur la page du livre`);
    procedures.push(`3. Connectez-vous à votre compte bibliothèque`);
    procedures.push(`4. Choisissez la date de retrait souhaitée`);
    procedures.push(`5. Confirmez la réservation`);
    
    procedures.push(`\nℹ️ Informations importantes:`);
    procedures.push(`• Vous pouvez réserver jusqu'à ${config.MaximumSimultaneousLoans} livres simultanément`);
    procedures.push(`• La réservation est valable 3 jours ouvrables`);
    procedures.push(`• Présentez votre carte de bibliothèque lors du retrait`);
    
    // Add specific rules if available
    if (config.SpecificBorrowingRules && config.SpecificBorrowingRules.length > 0) {
      const reservationRules = config.SpecificBorrowingRules.filter(rule => 
        rule.toLowerCase().includes('réservation') || 
        rule.toLowerCase().includes('reservation') ||
        rule.toLowerCase().includes('retrait')
      );
      
      if (reservationRules.length > 0) {
        procedures.push(`\n📜 Règles spécifiques:`);
        reservationRules.forEach(rule => {
          procedures.push(`• ${rule}`);
        });
      }
    }
    
    return procedures.join('\n');
  }

  /**
   * Gets book extension conditions from configuration
   */
  async getExtensionConditions(): Promise<string> {
    const config = await this.fetchOrgConfiguration();
    
    const conditions: string[] = [];
    
    conditions.push(`🔄 Conditions de prolongation à ${config.Name}:`);
    conditions.push(`1. Connectez-vous à votre compte bibliothèque`);
    conditions.push(`2. Accédez à "Mes emprunts"`);
    conditions.push(`3. Sélectionnez le livre à prolonger`);
    conditions.push(`4. Cliquez sur "Prolonger l'emprunt"`);
    conditions.push(`5. Confirmez la nouvelle date de retour`);
    
    conditions.push(`\n📌 Conditions importantes:`);
    conditions.push(`• La prolongation n'est possible que si le livre n'est pas réservé`);
    conditions.push(`• Vous pouvez prolonger jusqu'à 2 fois`);
    conditions.push(`• La durée de prolongation est de 14 jours`);
    
    // Check for late penalties that might affect extensions
    if (config.LateReturnPenalties && config.LateReturnPenalties.length > 0) {
      conditions.push(`\n⚠️ Attention:`);
      conditions.push(`• Les prolongations ne sont pas autorisées si vous avez des amendes en attente`);
      config.LateReturnPenalties.forEach(penalty => {
        if (penalty.toLowerCase().includes('prolong') || penalty.toLowerCase().includes('renouvel')) {
          conditions.push(`• ${penalty}`);
        }
      });
    }
    
    return conditions.join('\n');
  }

  /**
   * Gets library rules and policies from configuration
   */
  async getLibraryRules(): Promise<string> {
    const config = await this.fetchOrgConfiguration();
    
    const rules: string[] = [];
    
    rules.push(`📜 Règles générales de ${config.Name}:`);
    
    // Specific borrowing rules
    if (config.SpecificBorrowingRules && config.SpecificBorrowingRules.length > 0) {
      rules.push("\n📚 Règles d'emprunt:");
      config.SpecificBorrowingRules.forEach(rule => {
        rules.push(`• ${rule}`);
      });
    }
    
    // Late return penalties
    if (config.LateReturnPenalties && config.LateReturnPenalties.length > 0) {
      rules.push("\n⚠️ Pénalités pour retard:");
      config.LateReturnPenalties.forEach(penalty => {
        rules.push(`• ${penalty}`);
      });
    }
    
    // General rules (from your schema, we need to check if they exist)
    // Since they're not in your type, we'll add some defaults
    rules.push("\n🏛️ Règles de comportement:");
    rules.push("• Le silence doit être respecté dans les zones de lecture");
    rules.push("• Les téléphones portables doivent être en mode silencieux");
    rules.push("• La nourriture et les boissons sont interdites près des livres");
    rules.push("• Les enfants doivent être accompagnés");
    rules.push("• Présentez votre carte de bibliothèque à l'entrée");
    
    return rules.join('\n');
  }

  /**
   * Gets library address and location info
   */
  async getLibraryAddress(): Promise<string> {
    const config = await this.fetchOrgConfiguration();
    
    const info: string[] = [];
    
    info.push(`📍 Localisation de ${config.Name}:`);
    
    if (config.Address) {
      info.push(`Adresse: ${config.Address}`);
    }
    
    info.push("\n🚍 Accès:");
    info.push("• Transport en commun: Bus lignes 10, 15, 22");
    info.push("• Stationnement: Parking gratuit disponible");
    info.push("• Accès PMI: Rampe d'accès à l'entrée principale");
    
      // Add hours for reference
      const hours = config.OpeningHours;
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const todayIndex = new Date().getDay(); // 0 = Sunday
      
      // Map day names to your OpeningHours keys
      const dayMap: Record<string, keyof OpeningHours> = {
        'Dimanche': 'Sunday',
        'Lundi': 'Monday',
        'Mardi': 'Tuesday',
        'Mercredi': 'Wednesday',
        'Jeudi': 'Thursday',
        'Vendredi': 'Friday',
        'Samedi': 'Saturday'
      };
      
      const todayName = days[todayIndex];
      const hoursKey = dayMap[todayName];
      const todayHours = hours[hoursKey];
      
      if (todayHours && todayHours !== 'Fermé' && todayHours !== 'closed') {
        info.push(`\n🕐 Aujourd'hui (${todayName}): ${todayHours}`);
      }
      
      return info.join('\n');
  }

  /**
   * Gets information about late return penalties
   */
  async getLatePenalties(): Promise<string> {
    const config = await this.fetchOrgConfiguration();
    
    const penalties: string[] = [];
    
    penalties.push(`⚠️ Politique des retards à ${config.Name}:`);
    
    if (config.LateReturnPenalties && config.LateReturnPenalties.length > 0) {
      config.LateReturnPenalties.forEach(penalty => {
        penalties.push(`• ${penalty}`);
      });
    } else {
      penalties.push("• 0,50€ par jour de retard par livre");
      penalties.push("• Suspension du droit d'emprunt après 15 jours de retard");
      penalties.push("• Maximum de 10€ d'amende par livre");
    }
    
    penalties.push("\n💡 Comment éviter les amendes:");
    penalties.push("• Consultez régulièrement 'Mes emprunts' dans votre compte");
    penalties.push("• Activez les notifications de rappel par email");
    penalties.push("• Prolongez vos emprunts avant la date d'échéance");
    penalties.push("• Utilisez la boîte de retour extérieure après les heures d'ouverture");
    
    return penalties.join('\n');
  }

  // ==================== API METHODS ====================

  async post(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async get(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.headers,
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async getBookAvailability(title: string): Promise<any> {
    return this.post('/books/availability', { title });
  }

  async getUserStatus(userId: string): Promise<any> {
    return this.get(`/users/${userId}/status`);
  }

  // ==================== ASSISTANT-SPECIFIC METHODS ====================

  /**
   * Gets intelligent response based on user query and configuration
   */
  async getAssistantResponse(query: string): Promise<string> {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Check for specific intents with your exact schema
    if (this.containsAny(normalizedQuery, ['heure', 'horaires', 'ouvert', 'fermé', 'ouverture', 'fermeture', 'ouvre', 'ferme'])) {
      return await this.getLibraryHours();
    }
    
    if (this.containsAny(normalizedQuery, ['règle', 'règlement', 'politique', 'emprunt', 'prêt', 'emprunter'])) {
      return await this.getBorrowingRules();
    }
    
    if (this.containsAny(normalizedQuery, ['contact', 'email', 'téléphone', 'tél', 'phone', 'whatsapp', 'facebook', 'instagram', 'joindre', 'contacter'])) {
      return await this.getContactInfo();
    }
    
    if (this.containsAny(normalizedQuery, ['réserver', 'réservation', 'booking', 'hold', 'retrait'])) {
      return await this.getReservationProcedures();
    }
    
    if (this.containsAny(normalizedQuery, ['prolonger', 'renouveler', 'extension', 'renew', 'prolongation'])) {
      return await this.getExtensionConditions();
    }
    
    if (this.containsAny(normalizedQuery, ['amende', 'pénalité', 'retard', 'late', 'fine', 'penalty', 'sanction'])) {
      return await this.getLatePenalties();
    }
    
    if (this.containsAny(normalizedQuery, ['adresse', 'localisation', 'localiser', 'trouver', 'où', 'lieu', 'position'])) {
      return await this.getLibraryAddress();
    }
    
    if (this.containsAny(normalizedQuery, ['bonjour', 'salut', 'hello', 'hey', 'coucou'])) {
      const config = await this.fetchOrgConfiguration();
      return `Bonjour! Bienvenue à la bibliothèque ${config.Name}. Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?`;
    }
    
    if (this.containsAny(normalizedQuery, ['merci', 'remerci', 'gratitude'])) {
      return "Je vous en prie! N'hésitez pas à me contacter si vous avez d'autres questions. Bonne journée à la bibliothèque! 📚";
    }
    
    if (this.containsAny(normalizedQuery, ['livre', 'document', 'ouvrage', 'titre', 'auteur'])) {
      return `Pour rechercher un livre spécifique, veuillez me fournir le titre ou le nom de l'auteur. Vous pouvez également consulter notre catalogue en ligne ou vous rendre sur place pour une recherche plus approfondie.`;
    }
    
    // Fallback response
    const config = await this.fetchOrgConfiguration();
    return `Je comprends que vous demandez: "${query}". 

À la bibliothèque ${config.Name}, je peux vous aider avec:

📅 **Horaires d'ouverture** - Quand nous sommes ouverts
📚 **Règles d'emprunt** - Combien de livres, pour combien de temps
📞 **Contacts** - Email, téléphone, réseaux sociaux
📋 **Réservations** - Comment réserver un livre
🔄 **Prolongations** - Comment prolonger un emprunt
⚠️ **Pénalités** - Amendes pour retard
📍 **Adresse** - Comment nous trouver

Pouvez-vous préciser votre question ou choisir l'une de ces catégories ?`;
  }

  /**
   * Gets quick suggestions based on available configuration
   */
  async getQuickSuggestions(): Promise<Array<{text: string, query: string}>> {
    const config = await this.fetchOrgConfiguration();
    const suggestions: Array<{text: string, query: string}> = [];
    
    // Always include hours
    suggestions.push({ 
      text: "📅 Horaires", 
      query: "Quels sont les horaires d'ouverture ?" 
    });
    
    // Include borrowing rules
    suggestions.push({ 
      text: "📚 Règles", 
      query: "Quelles sont les règles d'emprunt ?" 
    });
    
    // Include contact if available
    if (config.Contact && (config.Contact.Email || config.Contact.Phone)) {
      suggestions.push({ 
        text: "📞 Contact", 
        query: "Comment contacter la bibliothèque ?" 
      });
    }
    
    // Include reservations
    suggestions.push({ 
      text: "🔖 Réserver", 
      query: "Comment réserver un livre ?" 
    });
    
    // Include address/location
    if (config.Address) {
      suggestions.push({ 
        text: "📍 Adresse", 
        query: "Où se trouve la bibliothèque ?" 
      });
    }
    
    // Include penalties if available
    if (config.LateReturnPenalties && config.LateReturnPenalties.length > 0) {
      suggestions.push({ 
        text: "⚠️ Amendes", 
        query: "Quelles sont les pénalités pour retard ?" 
      });
    }
    
    return suggestions;
  }

  /**
   * Checks if query contains any of the keywords
   */
  private containsAny(query: string, keywords: string[]): boolean {
    return keywords.some(keyword => query.includes(keyword));
  }

  /**
   * Merges configuration with defaults
   */
  private mergeWithDefaults(data: Partial<OrgSettings>): OrgSettings {
    try {
      const contact = data.Contact || {};
      const openingHours = data.OpeningHours || {};
      const theme = data.Theme || {};

      const result = {
        ...defaultOrgSettings,
        ...data,
        Contact: {
          ...defaultOrgSettings.Contact,
          ...contact
        },
        OpeningHours: {
          ...defaultOrgSettings.OpeningHours,
          ...openingHours
        },
        Theme: {
          ...defaultOrgSettings.Theme,
          ...theme
        }
      };

      // Ensure arrays are properly initialized
      if (!result.LateReturnPenalties || !Array.isArray(result.LateReturnPenalties)) {
        result.LateReturnPenalties = defaultOrgSettings.LateReturnPenalties;
      }

      if (!result.SpecificBorrowingRules || !Array.isArray(result.SpecificBorrowingRules)) {
        result.SpecificBorrowingRules = defaultOrgSettings.SpecificBorrowingRules;
      }

      return result;
    } catch (error) {
      console.error('Error merging with defaults:', error);
      return defaultOrgSettings;
    }
  }
}