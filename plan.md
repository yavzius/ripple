# Atomic Implementation Plan for Junior Dev

Here's a step-by-step breakdown of building the inbox, focusing on UI, data flow, and integrations:

## 1. Set Up Layout Structure ✓
**Objective**: Create an Outlook-style two-panel layout.

- [x] Left Panel (`<ConversationList />`):
  - [x] Displays a scrollable list of conversation cards
  - [x] Each card shows:
    - [x] Customer company name
    - [x] Last message snippet
    - [x] Timestamp
    - [x] Happiness score (colored)
    - [x] Status badge

- [x] Right Panel (`<MessageThread />`):
  - [x] Shows messages in a threaded view
  - [x] Includes header with customer context (company name, channel, status)

## 2. Fetch Conversations ✓
**Objective**: Load conversations from Supabase with sorting/filtering.

- [x] Basic query implementation:
  ```typescript
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*, customer:customer_id(*, customer_company:customer_company_id(*))')
    .eq('account_id', activeAccountId)
    .order('created_at', { ascending: false })
    .order('happiness_score', { ascending: true })
  ```

- [x] Filters:
  - [x] Channel filtering: `.eq('channel', selectedChannel)`
  - [x] Status filtering: `.eq('status', selectedStatus)`

## 3. Handle Conversation Selection ✓
**Objective**: When a user clicks a conversation, load its messages.

- [x] Store selected conversation ID in React state
- [x] Fetch messages where `conversation_id = selectedConversationId`
- [x] Update URL path (e.g., `/inbox/conv_123`)

## 4. Auto-Resolution by AI
**Objective**: AI resolves conversations if confidence ≥ 80%.

- [ ] Workflow:
  - [ ] For each new message:
    - [ ] Use OpenAI to generate response + calculate confidence score
    - [ ] If confidence ≥ 80%:
      - [ ] Insert AI response into messages table
      - [ ] Update conversation status to "resolved"
    - [ ] Else:
      - [ ] Create a ticket (next step)

## 5. Ticket Auto-Assignment
**Objective**: Assign tickets to agents based on issue type.

- [ ] Steps:
  - [ ] Use OpenAI to classify issue (e.g., "website_issue", "billing")
  - [ ] Query roles table to find agents tagged with issue type
  - [ ] Assign ticket to first available agent
  - [ ] Insert ticket with:
    - [ ] `assigned_to = agent ID`
    - [ ] `description = AI-generated steps`

## 6. Agent Actions
**Objective**: Let agents manually resolve or override AI.

- [ ] Manual Resolution:
  - [ ] Add "Resolve" button in `<MessageThread />`
  - [ ] On click: Update conversation status to "resolved"

- [ ] Override AI:
  - [ ] Allow agents to edit/delete AI messages
  - [ ] Add permissions check

## 7. Real-Time Updates ✓
**Objective**: Show new messages instantly.

- [x] Supabase real-time subscriptions:
  ```typescript
  supabase
    .channel('messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages'
    }, (payload) => {
      if (payload.new.conversation_id === selectedConversationId) {
        // Add message to UI
      }
      // Trigger desktop notification
      new Notification("New message", { body: payload.new.content });
    });
  ```

## 8. Merge Conversations
**Objective**: Let agents merge duplicate threads.

- [ ] Steps:
  - [ ] Add "Merge" button in `<ConversationList />`
  - [ ] On click:
    - [ ] Fetch conversations with same `customer_company_id`
    - [ ] Let agent select target conversation
    - [ ] Update all messages to use target `conversation_id`

## 9. File Attachments
**Objective**: Allow sending/receiving files.

- [ ] Steps:
  - [ ] Add file upload button to `<MessageThread />`
  - [ ] Upload file to Supabase Storage
  - [ ] Insert file metadata into files table linked to `message_id`
  - [ ] Display thumbnails for images, icons for PDFs

## 10. Testing & QA
**Objective**: Ensure all features work as expected.

- [ ] Checklist:
  - [x] Conversations sort by newest first
  - [ ] AI resolves high-confidence conversations
  - [ ] Tickets auto-assign to correct agent
  - [x] Desktop notifications trigger on new messages

## Next Steps
- [x] Start with Step 1 (Layout) and Step 2 (Fetch Conversations)
- [x] Test data loading with dummy conversations
- [ ] Gradually implement AI logic and real-time updates