// Partner lead type definition
export type PartnerLead = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
};

export type PartnerLeadCreateDTO = Omit<PartnerLead, 'id' | 'createdAt' | 'updatedAt' | 'status'>;
export type PartnerLeadUpdateDTO = Partial<PartnerLeadCreateDTO>;