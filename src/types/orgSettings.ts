export interface Theme {
	Primary: string;
	Secondary: string;
}

export interface Contact {
	Email: string;
	Facebook: string;
	Instagram: string;
	Phone: string;
	WhatsApp: string;
}

export interface OpeningHours {
	Monday: string;
	Tuesday: string;
	Wednesday: string;
	Thursday: string;
	Friday: string;
	Saturday: string;
	Sunday: string;
}

export interface OrgSettings {
	Address: string;
	Contact: Contact;
	MaintenanceMode?: boolean;
	LateReturnPenalties: string[];
	Logo: string;
	MaximumSimultaneousLoans: number;
	Name: string;
	OpeningHours: OpeningHours;
	SpecificBorrowingRules: string[];
	Theme: Theme;
}
