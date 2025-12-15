
export interface UserSession {
  username: string;
  role: 'admin';
}

export interface BidderSession {
  phoneNumber: string;
  name?: string;
  role: 'bidder';
}

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
  weight: number | null;
  condition: string;
  
  flaws: string;
  size: string;
  
  listed: boolean;
  flagged: boolean;

  sku: string;
  
  // Auction Specific Fields
  auctionEndTime?: number; // Timestamp in ms
  currentBid?: number;
  bidCount?: number;
  isWinning?: boolean; // Local state for the current user
}

export enum Status {
  IDLE,
  PROCESSING,
  SUCCESS,
  ERROR,
}
