import { DemoCompany, DemoCustomer, DemoScenario } from './types.ts';

export const DEMO_COMPANIES: DemoCompany[] = [
  // North America Companies (40%)
  {
    name: "Luxe Beauty Gallery",
    region: "NA",
    type: "department_store",
  },
  {
    name: "Pure Aesthetics Chain",
    region: "NA",
    type: "spa",
  },
  {
    name: "Elite Cosmetics Distributors",
    region: "NA",
    type: "distributor",
  },
  {
    name: "Glamour & Grace Salon Network",
    region: "NA",
    type: "salon",
  },
  // European Companies (30%)
  {
    name: "Maison de Beauté",
    region: "EU",
    type: "retailer",
  },
  {
    name: "Royal Beauty House",
    region: "EU",
    type: "department_store",
  },
  {
    name: "European Luxury Cosmetics",
    region: "EU",
    type: "distributor",
  },
  // APAC Companies (20%)
  {
    name: "Asian Beauty Emporium",
    region: "APAC",
    type: "retailer",
  },
  {
    name: "Pacific Luxury Distributors",
    region: "APAC",
    type: "distributor",
  },
  // Middle East (10%)
  {
    name: "Royal Beauty Oasis",
    region: "ME",
    type: "spa",
  },
];

export const DEMO_CUSTOMERS: Record<string, DemoCustomer[]> = {
  // Will be populated with company IDs as keys
  default: [
    {
      firstName: "Sarah",
      lastName: "Mitchell",
      role: "Purchasing Director",
    },
    {
      firstName: "James",
      lastName: "Wilson",
      role: "Beauty Department Head",
    },
    {
      firstName: "Emma",
      lastName: "Thompson",
      role: "Retail Operations Manager",
    },
    {
      firstName: "Alex",
      lastName: "Chen",
      role: "Store Manager",
    }
  ],
};

export const DEMO_SCENARIOS: DemoScenario[] = [
  // Wholesale Order Negotiation
  {
    conversation: {
      type: "negotiation",
      timeframe: "current_week",
      status: "open",
      happiness_score: 4,
    },
    messages: [
      {
        content: "Hi, I'm interested in placing a bulk order for the LUXE-SK-2023 Premium Skincare Collection. What's your current MOQ and pricing structure for luxury retailers?",
        sender_type: "customer",
        sentiment_score: 0.8,
        delay_minutes: 0,
      },
      {
        content: "Hello! Thank you for your interest in our Premium Skincare Collection. Our MOQ for luxury retailers is 100 units per SKU, with tiered pricing available for larger orders. Would you like me to share our detailed wholesale pricing sheet?",
        sender_type: "agent",
        sentiment_score: 0.9,
        delay_minutes: 15,
      },
      {
        content: "Yes, please. We're particularly interested in the Anti-aging Serum (SK001) and would likely order 250-300 units for our initial order.",
        sender_type: "customer",
        sentiment_score: 0.8,
        delay_minutes: 30,
      },
    ],
    ticket: {
      title: "Bulk Order Processing - LUXE-SK-2023",
      description: "New wholesale inquiry for Premium Skincare Collection. Initial interest in 250-300 units of SK001.",
      priority: "high",
      status: "open",
    },
  },
  // Training Request
  {
    conversation: {
      type: "training",
      timeframe: "last_week",
      status: "resolved",
      happiness_score: 5,
    },
    messages: [
      {
        content: "We need to schedule product training for our new staff on the latest LUXE-MC-2023 Mineral Makeup Collection. Do you offer comprehensive training programs?",
        sender_type: "customer",
        sentiment_score: 0.7,
        delay_minutes: 0,
      },
      {
        content: "Absolutely! We offer both virtual and in-person training sessions for our luxury partners. Our certified beauty educators can cover application techniques, product knowledge, and selling strategies. When would you like to schedule the training?",
        sender_type: "agent",
        sentiment_score: 0.9,
        delay_minutes: 20,
      },
    ],
  },
];

export function getDateForTimeframe(timeframe: string): string {
  const now = new Date();
  switch (timeframe) {
    case 'current_week':
      return now.toISOString();
    case 'last_week':
      now.setDate(now.getDate() - 7);
      return now.toISOString();
    case 'two_weeks_ago':
      now.setDate(now.getDate() - 14);
      return now.toISOString();
    case 'last_month':
      now.setDate(now.getDate() - 30);
      return now.toISOString();
    default:
      return now.toISOString();
  }
} 