export interface ContactInput {
  name: string;
  phone: string;
  email: string;
  role: string;
}

export interface GroupRef {
  id: string;
  name: string;
  isActive?: boolean;
}

export interface GroupItem extends GroupRef {
  isActive: boolean;
  customerCount: number;
  activeCustomerCount: number;
  priceCount: number;
}

export interface CustomerListItem {
  id: string;
  name: string;
  document: string;
  type: 'PRE_PAGO' | 'POS_PAGO';
  code: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  isActive: boolean;
  groupIds: string[];
  groups: GroupRef[];
  createdAt: string;
}

export interface CustomerDocument {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  userEmail: string;
  createdAt: string;
}

export interface CustomerNote {
  id: string;
  content: string;
  userEmail: string;
  createdAt: string;
}

export interface CustomerDetail extends CustomerListItem {
  street: string;
  number: string;
  zipCode: string;
  contacts: ContactInput[];
  documents: CustomerDocument[];
  notes: CustomerNote[];
}

export interface CustomerStats {
  total: number;
  active: number;
  prePaid: number;
  postPaid: number;
  inGroups: number;
}

export interface TimelineEvent {
  id: string;
  kind: 'crm' | 'audit' | 'invoice' | 'proposal' | 'lead';
  title: string;
  description: string;
  actor: string;
  type?: string;
  at: string;
}
