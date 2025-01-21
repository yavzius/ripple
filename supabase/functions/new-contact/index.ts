import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"
import { corsHeaders } from '../_shared/cors.ts'

interface CreateUserPayload {
  email: string
  firstName: string
  lastName: string
  role: string
  customerCompanyId: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase admin client
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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: verifyError } = await supabaseAdmin.auth.getUser(token)
    
    if (verifyError || !caller) {
      console.error('Auth error:', verifyError)
      throw new Error('Invalid authentication token')
    }

    console.log('Authenticated user:', caller.id)

    // Check if the caller has permission to create users
    const { data: callerData, error: callerError } = await supabaseAdmin
      .from('users')
      .select('role, account_id')
      .eq('id', caller.id)
      .single()

    if (callerError) {
      console.error('Caller data error:', callerError)
      throw new Error('Could not verify caller permissions')
    }

    if (!callerData) {
      console.error('No caller data found for user:', caller.id)
      throw new Error('User data not found')
    }

    console.log('Caller data:', callerData)

    // Parse the request body
    const payload = await req.json() as CreateUserPayload
    console.log('Request payload:', payload)

    const { email, firstName, lastName, role, customerCompanyId } = payload

    if (!customerCompanyId) {
      throw new Error('Customer company ID is required')
    }

    // Validate email format
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email format')
    }

    // Check if user already exists in auth
    try {
      const { data: existingUsers, error: existingError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existingError) {
        console.error('Error checking existing user:', existingError)
      } else if (existingUsers) {
        throw new Error('A user with this email already exists')
      }
    } catch (error) {
      console.error('Error in user check:', error)
      // Log but continue - this is not a critical error
    }

    // Get the target customer company's account information
    const { data: targetCompany, error: targetCompanyError } = await supabaseAdmin
      .from('customer_companies')
      .select('account_id')
      .eq('id', customerCompanyId)
      .single()

    if (targetCompanyError) {
      console.error('Target company error:', targetCompanyError)
      throw new Error('Invalid customer company ID ' + targetCompanyError.message)
    }

    if (!targetCompany) {
      console.error('No company found with ID:', customerCompanyId)
      throw new Error('Company not found')
    }

    console.log('Target company:', targetCompany)

    // Check if user is admin and belongs to the same account as the target company
    const hasPermission = callerData.role === 'admin' && callerData.account_id === targetCompany.account_id

    console.log('Permission check:', {
      role: callerData.role,
      userAccountId: callerData.account_id,
      companyAccountId: targetCompany.account_id,
      hasPermission
    })

    if (!hasPermission) {
      throw new Error('Insufficient permissions: must be an admin in the same account as the target company')
    }

    // Generate a random temporary password
    const temporaryPassword = Math.random().toString(36).slice(-12)

    // Create the user in Supabase Auth
    console.log('Creating auth user with email:', email)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password: temporaryPassword,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role,
          customer_company_id: customerCompanyId,
          account_id: targetCompany.account_id
        }
      }
    })

    if (authError) {
      console.error('Auth user creation error details:', {
        error: authError,
        email,
        message: authError.message
      })
      throw new Error(`Error creating auth user: ${authError.message}`)
    }

    if (!authUser?.user) {
      console.error('No auth user created')
      throw new Error('Failed to create auth user - no user returned')
    }

    // Add user details to public.users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        customer_company_id: customerCompanyId,
        account_id: targetCompany.account_id
      })

    if (userError) {
      console.error('User record creation error:', userError)
      throw new Error(`Error creating user record: ${userError.message}`)
    }

    return new Response(
      JSON.stringify({
        message: 'User created successfully',
        userId: authUser.user.id,
        temporaryPassword
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in new-contact function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
