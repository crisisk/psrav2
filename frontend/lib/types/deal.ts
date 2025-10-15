export enum DealStage {
  NEW = 'New',
  CONTACTED = 'Contacted',
  QUALIFIED = 'Qualified',
  PROPOSAL = 'Proposal',
  NEGOTIATION = 'Negotiation',
  WON = 'Won',
  LOST = 'Lost'
}

export type Deal = {
  id: string;
  name: string;
  stage: DealStage;
  amount: number;
  contact: string;
  createdAt: Date;
  updatedAt: Date;
};
