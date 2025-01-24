import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

interface CreateUserRequest {
  email: string
  first_name: string
  last_name?: string
  role: 'admin' | 'agent'
  account_id: string
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse request body
    const { email, first_name, last_name, role, account_id } = await req.json() as CreateUserRequest

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Generate a random password (they can reset it later)
    const tempPassword = crypto.randomUUID()

    // Create the user in auth.users
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name
      }
    })

    if (createError) {
      throw createError
    }

    // Create user record in users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: newUser.user.id,
        email,
        first_name,
        last_name
      })

    if (userError) {
      // Cleanup: delete auth user if users table insert fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      throw userError
    }

    // Create accounts_users association
    const { error: associationError } = await supabaseAdmin
      .from('accounts_users')
      .insert({
        user_id: newUser.user.id,
        account_id,
        role
      })

    if (associationError) {
      // Cleanup: delete both auth user and users record if association fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      await supabaseAdmin.from('users').delete().eq('id', newUser.user.id)
      throw associationError
    }

    // TODO: Send welcome email with temporary password
    // This would typically be handled by a separate email service

    return new Response(
      JSON.stringify({ 
        user: newUser.user,
        message: 'User created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error creating user:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.details || error.hint || null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
}) 