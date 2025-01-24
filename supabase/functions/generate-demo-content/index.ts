import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { corsHeaders } from '../_shared/cors.ts'
import { DemoContentGenerator } from './generators.ts'
import { DEMO_SCENARIOS } from './templates.ts'

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { accountId, userId } = await req.json()

    // Validate inputs
    if (!accountId || !userId) {
      throw new Error('accountId and userId are required')
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Initialize generator
    const generator = new DemoContentGenerator(supabase, accountId, userId)

    try {
      // Process in batches to avoid timeout
      const companies = await generator.generateCompanies()
      
      const BATCH_SIZE = 5
      for (let i = 0; i < companies.length; i += BATCH_SIZE) {
        const batch = companies.slice(i, i + BATCH_SIZE)
        await generator.processBatch(batch)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Demo content generated successfully',
          data: {
            companiesCreated: companies.length,
            totalScenarios: companies.length * 3 * DEMO_SCENARIOS.length
          }
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    } catch (error) {
      // Attempt rollback
      console.error('Error during generation:', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          message: 'Failed to generate demo content. All changes have been rolled back.'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to process request'
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
}) 