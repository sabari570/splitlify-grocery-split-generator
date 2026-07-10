export interface Member {
  id: string;
  name: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  totalAmount: number;
  sharedBy: string[];
}

export interface SplitSession {
  id: string;
  members: Member[];
  items: InvoiceItem[];
  payerVpa: string | null;
  payerMemberId: string | null;
  createdAt: string;
}

export interface SplitResult {
  memberId: string;
  memberName: string;
  amountOwed: number;
}

export interface CreateSessionInput {
  members: { name: string }[];
}

export interface UpdateSessionInput {
  members?: Member[];
  items?: InvoiceItem[];
  payerVpa?: string | null;
  payerMemberId?: string | null;
}
