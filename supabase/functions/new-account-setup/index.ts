// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'
import { Database } from './types.ts'

console.log("Hello from Functions!")

interface NewAccountSetupRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  companyName: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get request body
    const { email, password, firstName, lastName, companyName } = await req.json() as NewAccountSetupRequest

    // Input validation
    if (!email || !password || !firstName || !lastName || !companyName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate company slug
    const slug = companyName.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')

    try {
      // Create auth user
      const { data: { user }, error: signUpError } = await supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

      if (signUpError || !user) {
        throw signUpError || new Error('Failed to create user')
      }

      // Create account
      const { data: accountData, error: accountError } = await supabaseClient
        .from('accounts')
        .insert({ name: companyName, slug })
        .select()
        .single()

      if (accountError) throw accountError

      // Create user record
      const { error: userError } = await supabaseClient
        .from('users')
        .insert({
          id: user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          current_account_id: accountData.id
        })

      if (userError) throw userError

      // Create account_users record
      const { error: accountUserError } = await supabaseClient
        .from('accounts_users')
        .insert({
          account_id: accountData.id,
          user_id: user.id,
          role: 'admin'
        })

      if (accountUserError) throw accountUserError

      return new Response(
        JSON.stringify({ 
          user: {
            id: user.id,
            email,
            firstName,
            lastName
          },
          account: {
            account_id: accountData.id,
            company_name: companyName,
            company_slug: slug
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (err) {
      // Cleanup auth user if it was created
      if (err instanceof Error && 'user' in err && typeof err.user === 'object' && err.user && 'id' in err.user) {
        await supabaseClient.auth.admin.deleteUser(err.user.id as string)
      }
      
      console.error('Setup error:', err)
      return new Response(
        JSON.stringify({ error: 'Error setting up account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/new-account-setup' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
