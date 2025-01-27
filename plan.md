# Customer-Facing Chat System Implementation Plan

## Phase 1: Public Chat Route Setup
- [x] Create new route handler for `/@[brandSlug]` pattern
- [x] Create `BrandChat` page component with basic layout
- [x] Implement brand slug validation and lookup against accounts table
- [x] Create loading and error states for invalid/non-existent brand slugs

## Phase 2: Chat Interface Components
- [x] Create `PublicMessageThread` component based on existing `MessageThread`
- [x] Implement simplified version without agent/admin features
- [x] Create customer message input component
- [x] Reuse existing file attachment system from agent interface
- [x] Add real-time message subscription for public threads
- [x] Implement markdown support for messages
- [x] Add message delivery confirmations
- [x] Implement responsive design for mobile users

## Phase 3: Client-Side Session Management
- [x] Implement browser storage for temporary chat session
- [x] Add "Clear Chat" functionality for users
- [x] Add basic rate limiting for message sending
- [x] Add simple spam prevention (message frequency check)

## Security Considerations
- [x] Implement basic rate limiting per client
- [x] Add file upload size limits
- [x] Create basic content filtering for spam prevention
