export type Region = 'NA' | 'EU' | 'APAC' | 'ME';
export type CompanyType = 'department_store' | 'salon' | 'retailer' | 'distributor' | 'spa';
export type ConversationType = 'negotiation' | 'support' | 'training' | 'order';
export type TimeFrame = 'current_week' | 'last_week' | 'two_weeks_ago' | 'last_month';

export interface DemoCompany {
  name: string;
  region: Region;
  type: CompanyType;
  domain?: string;
}

export interface DemoCustomer {
  firstName: string;
  lastName: string;
  role: string;
}

export interface DemoConversation {
  type: ConversationType;
  timeframe: TimeFrame;
  status: 'open' | 'resolved';
  happiness_score?: number;
}

export interface DemoMessage {
  content: string;
  sender_type: 'customer' | 'agent';
  sentiment_score?: number;
  delay_minutes?: number; // Time after conversation start
}

export interface DemoTicket {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
}

export interface DemoScenario {
  conversation: DemoConversation;
  messages: DemoMessage[];
  ticket?: DemoTicket;
} 