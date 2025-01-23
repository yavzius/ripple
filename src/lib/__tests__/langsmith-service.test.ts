import { generateCustomerSupportResponse, analyzeCustomerSentiment } from '../langsmith-service';

async function testAIIntegration() {
  try {
    // Test sentiment analysis
    console.log('Testing sentiment analysis...');
    const sentimentScore = await analyzeCustomerSentiment(
      "I'm really happy with your service!",
      {
        messageId: 'test-message-id',
        conversationId: 'test-conversation-id',
      }
    );
    console.log('Sentiment score:', sentimentScore);

    // Test support response generation
    console.log('\nTesting support response generation...');
    const aiResponse = await generateCustomerSupportResponse(
      {
        messages: [
          { content: "How do I reset my password?", sender_type: "customer" }
        ],
        customer: {
          first_name: "Test",
          last_name: "User"
        },
        customer_company: {
          name: "Test Company"
        }
      },
      {
        conversationId: 'test-conversation-id',
        customerId: 'test-customer-id',
        companyId: 'test-company-id'
      }
    );
    console.log('AI Response:', aiResponse);

  } catch (error) {
    console.error('Test failed:', error);
    // Add this to see the full error response
    if (error.context?.json) {
      const errorDetails = await error.context.json();
      console.error('Error details:', errorDetails);
    }
  }
}

// Run the test
testAIIntegration(); 