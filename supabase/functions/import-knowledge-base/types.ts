// Request/Response Types
export interface ImportRequest {
  url: string;
  accountId: string;
}

export interface ImportResponse {
  success: boolean;
  message: string;
  documentCount: number;
  skippedCount?: number;
  error?: ErrorType;
  details?: unknown;
}

// Document Types
export interface DocumentMetadata {
  canonicalUrl: string;
  title: string;
  description?: string;
  author?: string | null;
  keywords?: string | null;
  languageCode?: string;
  openGraph?: Array<{
    property: string;
    content: string;
  }>;
  jsonLd?: unknown;
  headers?: Record<string, unknown>;
}

export interface JsonDocument {
  url: string;
  metadata: DocumentMetadata;
  markdown: string;
  content: string; // Making content required since we'll set it during validation
}

export interface ProcessedDocument {
  content: string;
  metadata: DocumentMetadata;
  embedding: number[];
  categories: string[];
  keywords: string[];
}

// Error Types
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  FETCH = 'FETCH_ERROR',
  AI = 'AI_ERROR',
  DATABASE = 'DATABASE_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
  PROCESSING = 'PROCESSING_ERROR'
}

export interface ProcessingError {
  type: ErrorType;
  message: string;
  details?: unknown;
}

// Database Types
export interface DocumentRecord {
  id: string;
  account_id: string;
  content: string;
  metadata: DocumentMetadata;
  embedding: number[];
  ai_metadata: {
    categories: string[];
    keywords: string[];
    model_info: {
      embedding: string;
      categorization: string;
      keywords: string;
    };
    confidence_scores?: {
      categorization: number;
      keywords: number;
    };
  };
  created_at: string;
  updated_at: string;
}

// Processing Status Types
export interface ProcessingStatus {
  total: number;
  processed: number;
  failed: number;
  inProgress: number;
  errors: Array<{
    document: string;
    error: string;
    type: ErrorType;
  }>;
}

// API Response Types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    type: ErrorType;
    message: string;
    details?: unknown;
  };
};

export interface BatchProcessingResponse extends ApiResponse<{
  documentCount: number;
  status: ProcessingStatus;
}> {} 