# CRM System Redesign Plan: Unified Message Stream

## Overview
Transform the system into a unified message stream where:
- Both customers and support team can communicate freely
- All communication channels (email, live chat, slack) are unified in one stream
- Single AI support agent interface for customers
- Internal support team collaborates behind the scenes
- Messages can be tagged for organization but remain in one stream

## Database Schema Changes

### 1. Channels Table
```sql
create table channels (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  config jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  is_active boolean default true,
  organization_id uuid references organizations(id)
);

-- Index for faster lookups
create index idx_channels_org on channels(organization_id);
```

### 2. Messages Table
```sql
create table messages (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id),
  channel_id uuid references channels(id),
  sender_id uuid references users(id),
  content text not null,
  created_at timestamp with time zone default now(),
  message_type text check (message_type in ('text', 'file')),
  parent_message_id uuid references messages(id),
  tags jsonb,
  sentiment_score integer,
  metadata jsonb,
  ticket_id uuid references tickets(id) null
);

-- Indexes for faster lookups and joins
create index idx_messages_org on messages(organization_id);
create index idx_messages_channel on messages(channel_id);
create index idx_messages_parent on messages(parent_message_id);
```

### 3. Internal Tickets Table (Admin Only)
```sql
create table tickets (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id),
  created_by uuid references users(id),
  title text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  status text check (status in ('open', 'in_progress', 'resolved')) default 'open',
  internal_notes text
);
```

## Frontend Implementation Tasks

### 1. Customer Portal
- Real-time chat interface
- File attachment support (screenshots and documents)
- Mobile responsive design
- Clean, unified message stream
- No online/offline indicators
- No ticket visibility

### 2. Admin Portal
- Unified message stream with channel indicators
- AI support agent configuration
- Internal ticket creation and management
- Message tagging interface
- Sentiment analysis display
- Response time metrics
- File preview and management

### 3. Shared Components
- Real-time message components
- File upload/preview components
- Message stream virtualization for performance
- Channel-specific message formatting

## Integration Architecture

### 1. Channel Integration
- Email integration service
- Live chat websocket service
- Slack integration service
- Message normalization layer
- Central message bus

### 2. AI Support Layer
- AI agent interface
- Support team routing
- Message analysis service
- Sentiment scoring service

## API Implementation

### 1. Message Endpoints
- GET /api/messages/:orgId
- POST /api/messages
- GET /api/messages/search
- POST /api/messages/:id/tag

### 2. Internal Endpoints (Admin Only)
- POST /api/tickets
- PUT /api/messages/:id/analyze
- GET /api/analytics/response-time
- GET /api/analytics/sentiment

## Development Phases

### Phase 1: Core Messaging
1. Implement basic message stream
2. Add real-time capabilities
3. Setup file handling
4. Create mobile responsive UI

### Phase 2: Channel Integration
1. Email integration
2. Live chat implementation
3. Message normalization
4. Channel indicators

### Phase 3: Admin Tools
1. Internal ticket system
2. Message tagging
3. Basic analytics
4. File management

### Phase 4: AI Integration
1. AI support agent interface
2. Sentiment analysis
3. Response time tracking
4. Support team routing

## Testing Requirements

1. Message Flow
- Real-time delivery across all channels
- File attachments
- Mobile responsiveness
- Performance with large message history

2. Admin Features
- Internal ticket management
- Message tagging
- Analytics accuracy
- File handling

3. Integration Testing
- Channel synchronization
- AI support agent responses
- Analytics processing

## Next Steps

1. Review and approve simplified schema
2. Set up development environment
3. Begin with core messaging implementation
4. Plan channel integration strategy
