export interface Item {
  id: string; // App-specific UUID
  airtableId?: string; // Airtable Record ID

  images: string[]; // base64 data URLs
  name: string;
  maker: string;
  description: string;
  price: number | null;
  category: string;
  tags: string[];
  
  consigned: boolean;
  consignee: string;

  shippable: boolean;
  condition: string;
  
  flaws: string;
  size: string;
  
  listed: boolean;
  flagged: boolean;

  sku: string;
}

export enum Status {
  IDLE,
  PROCESSING,
  SUCCESS,
  ERROR,
}

export interface UserSession {
  username: string;
}