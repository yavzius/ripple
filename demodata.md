-- Demo Data SQL Queries for Shoretide
-- Note: Run these queries in order due to foreign key dependencies

-- 2. Create Demo Users
INSERT INTO users (id, email, full_name, avatar_url, organization_id, role, expertise) VALUES
-- TechCorp Solutions Users
('cb34db10-c1b2-4e3f-9833-1bce3418af99', 'admin@techcorp.com', 'John Smith', 'https://ui-avatars.com/api/?name=John+Smith', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a', 'admin', '["technical", "billing", "security"]'),
('1fb29e50-31bd-4eee-9b47-74f89523533a', 'agent1@techcorp.com', 'Sarah Johnson', 'https://ui-avatars.com/api/?name=Sarah+Johnson', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a', 'agent', '["customer-support", "technical"]'),

-- Startup Innovate Users
('a148dbd1-07b5-4dd4-a436-ffe417920cdc', 'admin@startupinnovate.io', 'Emma Davis', 'https://ui-avatars.com/api/?name=Emma+Davis', 'f9b4c3a2-1d8e-4f7b-9c6d-5e4a3b2c1d0e', 'admin', '["product", "technical"]'),
('b13ee060-5297-4dd2-8853-d4c2db823110', 'support@startupinnovate.io', 'Alex Chen', 'https://ui-avatars.com/api/?name=Alex+Chen', 'f9b4c3a2-1d8e-4f7b-9c6d-5e4a3b2c1d0e', 'agent', '["customer-support"]');

-- 3. Create Demo Tickets
INSERT INTO tickets (id, ticket_number, subject, description, status, priority, category, customer_id, assignee_id, organization_id, sentiment) VALUES
-- TechCorp Tickets
('1a2b3c4d-5e6f-4a3b-8c9d-1e2f3a4b5c6d', 'TKT-001', 'Cannot access admin dashboard', 'Getting 403 error when trying to access the admin dashboard since this morning.', 'open', 'high', 'technical', 'cb34db10-c1b2-4e3f-9833-1bce3418af99', '1fb29e50-31bd-4eee-9b47-74f89523533a', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a', 'negative'),
('2b3c4d5e-6f7a-4b3c-8d9e-2f3a4b5c6d7e', 'TKT-002', 'Billing inquiry for enterprise plan', 'Need clarification on the latest invoice charges.', 'in_progress', 'medium', 'billing', 'cb34db10-c1b2-4e3f-9833-1bce3418af99', '1fb29e50-31bd-4eee-9b47-74f89523533a', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a', 'neutral'),

-- Startup Innovate Tickets
('3c4d5e6f-7a8b-4c3d-9e0f-3f4a5b6c7d8e', 'TKT-003', 'Feature request: Dark mode', 'Would love to see a dark mode option in the next update.', 'open', 'low', 'feature', 'b13ee060-5297-4dd2-8853-d4c2db823110', 'a148dbd1-07b5-4dd4-a436-ffe417920cdc', 'f9b4c3a2-1d8e-4f7b-9c6d-5e4a3b2c1d0e', 'positive');

-- 4. Create Demo Messages
INSERT INTO messages (id, ticket_id, sender_id, content, is_ai_generated, is_internal, sentiment) VALUES
-- Messages for TKT-001
('aa1b2c3d-4e5f-4a3b-8c9d-0e1f2a3b4c5d', '1a2b3c4d-5e6f-4a3b-8c9d-1e2f3a4b5c6d', 'cb34db10-c1b2-4e3f-9833-1bce3418af99', 'I cannot access the admin dashboard. Getting 403 error.', false, false, 'negative'),
('bb2c3d4e-5f6a-4b3c-9d0e-1f2a3b4c5d6e', '1a2b3c4d-5e6f-4a3b-8c9d-1e2f3a4b5c6d', '1fb29e50-31bd-4eee-9b47-74f89523533a', E'I\'ll look into this right away. Can you confirm if you\'re using the correct admin credentials?', false, false, 'neutral'),

-- Messages for TKT-002
('cc3d4e5f-6a7b-4c3d-0e1f-2a3b4c5d6e7f', '2b3c4d5e-6f7a-4b3c-8d9e-2f3a4b5c6d7e', 'cb34db10-c1b2-4e3f-9833-1bce3418af99', E'The latest invoice shows charges that I don\'t understand.', false, false, 'negative'),
('dd4e5f6a-7b8c-4d3e-1f2a-3b4c5d6e7f8a', '2b3c4d5e-6f7a-4b3c-8d9e-2f3a4b5c6d7e', '1fb29e50-31bd-4eee-9b47-74f89523533a', E'I\'ll review the charges and provide a detailed breakdown.', false, false, 'neutral');

-- 5. Create Demo Documents (Knowledge Base)
INSERT INTO documents (id, title, content, category, status, author_id, organization_id) VALUES
('1b2c3d4e-5f6a-4b3c-9d0e-1f2a3b4c5d6e', 'Getting Started Guide', 'Welcome to our platform! This guide will help you get started with the basic features...', 'onboarding', 'published', 'cb34db10-c1b2-4e3f-9833-1bce3418af99', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a'),
('2c3d4e5f-6a7b-4c3d-0e1f-2a3b4c5d6e7f', 'Admin Dashboard Tutorial', 'Learn how to effectively use the admin dashboard features...', 'tutorial', 'published', '1fb29e50-31bd-4eee-9b47-74f89523533a', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a'),
('3d4e5f6a-7b8c-4d3e-1f2a-3b4c5d6e7f8a', 'Billing FAQ', 'Frequently asked questions about billing and subscriptions...', 'billing', 'published', 'a148dbd1-07b5-4dd4-a436-ffe417920cdc', 'f9b4c3a2-1d8e-4f7b-9c6d-5e4a3b2c1d0e');

-- 6. Create Demo Learning Cards
INSERT INTO learning_cards (id, organization_id, creator_id, trigger, context, suggested_response, status, priority, category) VALUES
('4e5f6a7b-8c9d-4e3f-2a3b-4c5d6e7f8a9b', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a', 'cb34db10-c1b2-4e3f-9833-1bce3418af99', 'access_denied', 'User reports 403 error when accessing admin dashboard', E'Please verify you\'re using the correct admin credentials and your account has the necessary permissions. If the issue persists, I can help reset your access.', 'completed', 'high', 'technical'),
('5f6a7b8c-9d0e-4f3a-3b4c-5d6e7f8a9b0c', 'f9b4c3a2-1d8e-4f7b-9c6d-5e4a3b2c1d0e', 'a148dbd1-07b5-4dd4-a436-ffe417920cdc', 'billing_inquiry', 'Customer asks about unclear charges on invoice', E'I\'ll help you understand the charges on your invoice. Could you please specify which items need clarification?', 'pending', 'medium', 'billing');

-- 7. Create Demo Training Sessions
INSERT INTO training_sessions (id, organization_id, trainer_id, status, cards_reviewed, cards_approved, cards_rejected) VALUES
('6a7b8c9d-0e1f-4a3b-4c5d-6e7f8a9b0c1d', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a', 'cb34db10-c1b2-4e3f-9833-1bce3418af99', 'completed', 10, 8, 2),
('7b8c9d0e-1f2a-4b3c-5d6e-7f8a9b0c1d2e', 'f9b4c3a2-1d8e-4f7b-9c6d-5e4a3b2c1d0e', 'a148dbd1-07b5-4dd4-a436-ffe417920cdc', 'in_progress', 5, 3, 2);

-- 8. Create Demo Training Feedback
INSERT INTO training_feedback (id, organization_id, session_id, card_id, trainer_id, is_approved, notes) VALUES
('8c9d0e1f-2a3b-4c5d-6e7f-8a9b0c1d2e3f', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a', '6a7b8c9d-0e1f-4a3b-4c5d-6e7f8a9b0c1d', '4e5f6a7b-8c9d-4e3f-2a3b-4c5d6e7f8a9b', 'cb34db10-c1b2-4e3f-9833-1bce3418af99', true, 'Good response, covers verification and offers solution'),
('9d0e1f2a-3b4c-5d6e-7f8a-9b0c1d2e3f4a', 'f9b4c3a2-1d8e-4f7b-9c6d-5e4a3b2c1d0e', '7b8c9d0e-1f2a-4b3c-5d6e-7f8a9b0c1d2e', '5f6a7b8c-9d0e-4f3a-3b4c-5d6e7f8a9b0c', 'a148dbd1-07b5-4dd4-a436-ffe417920cdc', true, 'Professional and helpful response to billing inquiry');

-- 9. Create Demo AI Interactions
INSERT INTO ai_interactions (id, organization_id, ticket_id, interaction_type, prompt, response, confidence_score, was_successful) VALUES
('0e1f2a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a', '1a2b3c4d-5e6f-4a3b-8c9d-1e2f3a4b5c6d', 'auto_routing', 'Route ticket: Cannot access admin dashboard', '{"suggested_assignee": "1fb29e50-31bd-4eee-9b47-74f89523533a", "reason": "Technical expertise match"}', 0.92, true),
('1f2a3b4c-5d6e-7f8a-9b0c-1d2e3f4a5b6c', 'f9b4c3a2-1d8e-4f7b-9c6d-5e4a3b2c1d0e', '3c4d5e6f-7a8b-4c3d-9e0f-3f4a5b6c7d8e', 'sentiment_analysis', 'Analyze sentiment: Would love to see a dark mode option', '{"sentiment": "positive", "confidence": 0.88}', 0.88, true);

-- Add More Users
INSERT INTO users (id, email, full_name, avatar_url, organization_id, role, expertise) VALUES
-- Additional TechCorp Solutions Users
('d8e9f0a1-b2c3-4d5e-6f7a-8a9b0c1d2e3f', 'agent2@techcorp.com', 'David Lee', 'https://ui-avatars.com/api/?name=David+Lee', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a', 'agent', '["billing", "customer-support"]'),
('e9f0a1b2-c3d4-5e6f-7a8b-9a0b1c2d3e4f', 'agent3@techcorp.com', 'Maria Garcia', 'https://ui-avatars.com/api/?name=Maria+Garcia', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a', 'agent', '["technical", "security"]'),
('f0a1b2c3-d4e5-6f7a-8b9c-0a1b2c3d4e5f', 'customer2@client.com', 'James Wilson', 'https://ui-avatars.com/api/?name=James+Wilson', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a', 'customer', '[]'),

-- Additional Startup Innovate Users
('a1b2c3d4-e5f6-7a8b-9c0d-1a2b3c4d5e6f', 'developer@startupinnovate.io', 'Ryan Zhang', 'https://ui-avatars.com/api/?name=Ryan+Zhang', 'f9b4c3a2-1d8e-4f7b-9c6d-5e4a3b2c1d0e', 'agent', '["technical", "development"]'),
('b2c3d4e5-f6a7-8b9c-0d1e-2a3b4c5d6e7f', 'customer1@startup.com', 'Sophie Turner', 'https://ui-avatars.com/api/?name=Sophie+Turner', 'f9b4c3a2-1d8e-4f7b-9c6d-5e4a3b2c1d0e', 'customer', '[]');

-- Add More Tickets
INSERT INTO tickets (id, ticket_number, subject, description, status, priority, category, customer_id, assignee_id, organization_id, sentiment) VALUES
-- Additional TechCorp Tickets
('4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 'TKT-004', 'API Integration Issues', 'Getting timeout errors when calling the analytics endpoint', 'open', 'high', 'technical', 'f0a1b2c3-d4e5-6f7a-8b9c-0a1b2c3d4e5f', 'e9f0a1b2-c3d4-5e6f-7a8b-9a0b1c2d3e4f', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a', 'negative'),
('5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b', 'TKT-005', 'Account upgrade request', 'Would like to upgrade to enterprise plan', 'in_progress', 'medium', 'billing', 'f0a1b2c3-d4e5-6f7a-8b9c-0a1b2c3d4e5f', 'd8e9f0a1-b2c3-4d5e-6f7a-8a9b0c1d2e3f', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a', 'positive'),

-- Additional Startup Innovate Tickets
('6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c', 'TKT-006', 'Mobile app crashes', 'App crashes when uploading large files', 'open', 'high', 'bug', 'b2c3d4e5-f6a7-8b9c-0d1e-2a3b4c5d6e7f', 'a1b2c3d4-e5f6-7a8b-9c0d-1a2b3c4d5e6f', 'f9b4c3a2-1d8e-4f7b-9c6d-5e4a3b2c1d0e', 'negative');

-- Add More Messages
INSERT INTO messages (id, ticket_id, sender_id, content, is_ai_generated, is_internal, sentiment) VALUES
-- Messages for TKT-004
('ee5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b', '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 'f0a1b2c3-d4e5-6f7a-8b9c-0a1b2c3d4e5f', 'The API keeps timing out after 30 seconds. This is blocking our production deployment.', false, false, 'negative'),
('ff6a7b8c-9d0e-1f2a-3b4c-5d6e7f8a9b0c', '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 'e9f0a1b2-c3d4-5e6f-7a8b-9a0b1c2d3e4f', 'I understand the urgency. Could you share your API request logs?', false, false, 'neutral'),
('aa7b8c9d-0e1f-2a3b-4c5d-6e7f8a9b0c1d', '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 'e9f0a1b2-c3d4-5e6f-7a8b-9a0b1c2d3e4f', E'I noticed the issue. Your requests are exceeding the rate limit. I\'ll increase your quota.', false, true, 'neutral'),

-- Messages for TKT-006
('bb8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e', '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c', 'b2c3d4e5-f6a7-8b9c-0d1e-2a3b4c5d6e7f', 'The app crashes every time I try to upload files larger than 50MB', false, false, 'negative'),
('cc9d0e1f-2a3b-4c5d-6e7f-8a9b0c1d2e3f', '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c', 'a1b2c3d4-e5f6-7a8b-9c0d-1a2b3c4d5e6f', 'Thanks for reporting. Can you share the app version and device model?', false, false, 'neutral');

-- Add More Documents
INSERT INTO documents (id, title, content, category, status, author_id, organization_id) VALUES
('4e5f6a7b-8c9d-0e1f-2a3b-3c4d5e6f7a8b', 'API Rate Limits Guide', 'Understanding and managing API rate limits in your integration...', 'technical', 'published', 'e9f0a1b2-c3d4-5e6f-7a8b-9a0b1c2d3e4f', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a'),
('5f6a7b8c-9d0e-1f2a-3b4c-4d5e6f7a8b9c', 'Mobile App Troubleshooting', 'Common issues and solutions for the mobile application...', 'support', 'published', 'a1b2c3d4-e5f6-7a8b-9c0d-1a2b3c4d5e6f', 'f9b4c3a2-1d8e-4f7b-9c6d-5e4a3b2c1d0e'),
('6a7b8c9d-0e1f-2a3b-4c5d-5e6f7a8b9c0d', 'Enterprise Plan Features', 'Detailed overview of enterprise plan benefits and features...', 'billing', 'published', 'd8e9f0a1-b2c3-4d5e-6f7a-8a9b0c1d2e3f', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a');

-- Add More Learning Cards
INSERT INTO learning_cards (id, organization_id, creator_id, trigger, context, suggested_response, status, priority, category) VALUES
('7b8c9d0e-1f2a-3b4c-5d6e-6f7a8b9c0d1e', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a', 'e9f0a1b2-c3d4-5e6f-7a8b-9a0b1c2d3e4f', 'api_timeout', 'User reports API timeout issues', E'I understand you\'re experiencing API timeouts. First, let\'s check your current rate limits and recent request logs. Could you share your API client ID?', 'pending', 'high', 'technical'),
('8c9d0e1f-2a3b-4c5d-6e7f-7a8b9c0d1e2f', 'f9b4c3a2-1d8e-4f7b-9c6d-5e4a3b2c1d0e', 'a1b2c3d4-e5f6-7a8b-9c0d-1a2b3c4d5e6f', 'mobile_crash', 'User reports mobile app crashes during file upload', E'I\'ll help you resolve the app crash issue. To better assist you, please provide: 1) App version 2) Device model 3) Size of file being uploaded', 'pending', 'high', 'technical');

-- Add More Training Sessions
INSERT INTO training_sessions (id, organization_id, trainer_id, status, cards_reviewed, cards_approved, cards_rejected) VALUES
('9d0e1f2a-3b4c-5d6e-7f8a-8b9c0d1e2f3a', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a', 'e9f0a1b2-c3d4-5e6f-7a8b-9a0b1c2d3e4f', 'in_progress', 15, 12, 3),
('0e1f2a3b-4c5d-6e7f-8a9b-9c0d1e2f3a4b', 'f9b4c3a2-1d8e-4f7b-9c6d-5e4a3b2c1d0e', 'a1b2c3d4-e5f6-7a8b-9c0d-1a2b3c4d5e6f', 'completed', 8, 7, 1);

-- Add More Training Feedback
INSERT INTO training_feedback (id, organization_id, session_id, card_id, trainer_id, is_approved, notes) VALUES
('1f2a3b4c-5d6e-7f8a-9b0c-0d1e2f3a4b5c', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a', '9d0e1f2a-3b4c-5d6e-7f8a-8b9c0d1e2f3a', '7b8c9d0e-1f2a-3b4c-5d6e-6f7a8b9c0d1e', 'e9f0a1b2-c3d4-5e6f-7a8b-9a0b1c2d3e4f', true, 'Excellent technical response with clear next steps'),
('2a3b4c5d-6e7f-8a9b-0c1d-1e2f3a4b5c6d', 'f9b4c3a2-1d8e-4f7b-9c6d-5e4a3b2c1d0e', '0e1f2a3b-4c5d-6e7f-8a9b-9c0d1e2f3a4b', '8c9d0e1f-2a3b-4c5d-6e7f-7a8b9c0d1e2f', 'a1b2c3d4-e5f6-7a8b-9c0d-1a2b3c4d5e6f', true, 'Well-structured troubleshooting approach');

-- Add More AI Interactions
INSERT INTO ai_interactions (id, organization_id, ticket_id, interaction_type, prompt, response, confidence_score, was_successful) VALUES
('3b4c5d6e-7f8a-9b0c-1d2e-2f3a4b5c6d7e', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a', '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 'auto_routing', 'Route ticket: API Integration Issues', '{"suggested_assignee": "e9f0a1b2-c3d4-5e6f-7a8b-9a0b1c2d3e4f", "reason": "Technical API expertise"}', 0.95, true),
('4c5d6e7f-8a9b-0c1d-2e3f-3a4b5c6d7e8f', 'f9b4c3a2-1d8e-4f7b-9c6d-5e4a3b2c1d0e', '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c', 'auto_tagging', 'Tag ticket: Mobile app crashes when uploading large files', '{"tags": ["mobile", "crash", "file-upload"], "confidence": 0.89}', 0.89, true),
('5d6e7f8a-9b0c-1d2e-3f4a-4b5c6d7e8f9a', 'd7a2c49c-f34e-4c5e-8bcd-7dd1c8e6787a', '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b', 'sentiment_analysis', 'Analyze sentiment: Would like to upgrade to enterprise plan', '{"sentiment": "positive", "confidence": 0.91}', 0.91, true);
