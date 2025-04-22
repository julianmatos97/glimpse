export type Lead = {
  id: string;
  name: string;
  contactInfo: string;
  source: LeadSource;
  interestLevel: InterestLevel;
  status: LeadStatus;
  assignedSalesperson: string;
  salespersonId?: number;
};

export type LeadSource = "Referral" | "Website" | "Cold Call" | "Event";

export type InterestLevel = "Low" | "Medium" | "High";

export type LeadStatus = "New" | "Contacted" | "Qualified" | "Closed";

export type LeadFilters = {
  search: string;
  source?: LeadSource;
  interestLevel?: InterestLevel;
  status?: LeadStatus;
  assignedSalesperson?: string;
};
