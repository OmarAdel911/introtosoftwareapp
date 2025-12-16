export interface Contract {
  id: string;
  jobId: string;
  clientId: string;
  freelancerId: string;
  status: ContractStatus;
  terms: string;
  amount: number;
  startDate: string;
  endDate: string;
  createdAt: Date;
  updatedAt: Date;
  declineReason?: string;
  ticketId?: string;
  submissionData?: ContractSubmission;
  clientFeedback?: string;
  proposal: {
    id: string;
    job: {
      id: string;
      title: string;
      description: string;
      client: {
        id: string;
        name: string;
        email: string;
      };
    };
    freelancer: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export enum ContractStatus {
  PENDING = 'PENDING',
  FREELANCER_ACCEPTED = 'FREELANCER_ACCEPTED', 
  CLIENT_ACCEPTED = 'CLIENT_ACCEPTED',
  ACTIVE = 'ACTIVE',
  PENDING_REVIEW = 'PENDING_REVIEW',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  UNDER_ADMIN_REVIEW = 'UNDER_ADMIN_REVIEW'
}

export interface ContractSubmission {
  description: string;
  fileUrl?: string;
}