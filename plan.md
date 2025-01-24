# Sign-up Flow Implementation Checklist

## 🎯 Goal
Create a single-form sign-up experience that collects user and account information in one step.

## 📋 Implementation Checklist

### 1️⃣ Setup Project Structure
- [x] Create new component file `SignUpForm.tsx` in `src/components/auth/`
- [x] Add form component to `Auth.tsx` page
- [x] Create new edge function file `create-account-and-user.ts` in `supabase/functions/`

### 2️⃣ Create Form Component (SignUpForm.tsx)
- [x] Add form container with proper styling
- [x] Add form fields:
  - [x] Email input with type="email"
  - [x] Password input with type="password"
  - [x] First Name input
  - [x] Last Name input
  - [x] Company Name input
- [x] Add submit button
- [x] Add loading spinner component
- [x] Add error message display area

### 3️⃣ Implement Form Validation
- [ ] Add email format validation
  ```typescript
  // Example validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  ```
- [ ] Add password validation (minimum 6 characters only)
  ```typescript
  const isValidPassword = (password: string) => {
    return password.length >= 6;
  }
  ```
- [ ] Add required field validation for all fields
- [ ] Add company name validation:
  ```typescript
  const isValidCompanyName = (name: string) => {
    return name.length >= 2 && name.length <= 20;
  }
  ```
- [ ] Add slug generation from company name:
  ```typescript
  const generateSlug = (name: string) => {
    return name.toLowerCase()
             .replace(/[^\w\s-]/g, '')
             .replace(/\s+/g, '-');
  }
  ```
- [ ] Show validation errors under each field
- [ ] Disable submit button when form is invalid

### 4️⃣ Create Edge Function
- [ ] Setup basic edge function structure
- [ ] Add input validation
- [ ] Implement database operations in this order:
  1. [ ] Create auth user
  2. [ ] Create users record
  3. [ ] Create accounts record
  4. [ ] Create accounts_users record
  5. [ ] Update user's current_account_id
- [ ] Add error handling for each step
- [ ] Add transaction wrapper
- [ ] Test function locally

### 5️⃣ Connect Frontend to Edge Function
- [ ] Add loading state management
- [ ] Implement form submission handler
- [ ] Add error handling for API responses
- [ ] Add success handling and redirect
- [ ] Test the complete flow

### 6️⃣ Add Loading States
- [ ] Add loading spinner during submission
- [ ] Disable form while submitting
- [ ] Show appropriate loading messages

### 7️⃣ Error Handling
- [ ] Display API errors clearly
- [ ] Add retry mechanism for failed submissions
- [ ] Handle network errors
- [ ] Show user-friendly error messages

### 8️⃣ Testing
- [ ] Test form validation
- [ ] Test successful submission
- [ ] Test error scenarios
- [ ] Test loading states
- [ ] Test with different input combinations

### 9️⃣ Final Polish
- [ ] Add success message
- [ ] Add redirect to dashboard after successful signup
- [ ] Ensure all error messages are user-friendly
- [ ] Test on different browsers
- [ ] Review and improve UX

## 📝 Database Schema Reference

### Users Table
```sql
id: uuid (from auth.users)
email: string
first_name: string
last_name: string
current_account_id: uuid (nullable)
created_at: timestamp
```

### Accounts Table
```sql
id: uuid
name: string
slug: string
created_at: timestamp
```

### Accounts Users Table
```sql
account_id: uuid
user_id: uuid
role: string ('admin')
```

## 🔍 Testing Scenarios
1. Happy Path:
   - [ ] All fields filled correctly
   - [ ] Successful submission
   - [ ] Proper redirect

2. Error Cases:
   - [ ] Invalid email format
   - [ ] Weak password
   - [ ] Missing required fields
   - [ ] Network error
   - [ ] Server error

3. Edge Cases:
   - [ ] Duplicate email
   - [ ] Special characters in company name
   - [ ] Very long input values
