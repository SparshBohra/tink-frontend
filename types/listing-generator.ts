export interface Property {
  id: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  rent: number;
  description: string;
  amenities: string[];
  images: string[];
  latitude?: number;
  longitude?: number;
}

export interface Platform {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  color: string;
  description: string;
}

export interface AgentThought {
  id: string;
  step: string;
  status: 'pending' | 'processing' | 'completed';
  message: string;
  icon?: string;
}

export type AppState = 'input' | 'thinking' | 'preview' | 'platforms' | 'success';


