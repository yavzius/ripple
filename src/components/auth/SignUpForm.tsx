import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// Validation functions
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPassword = (password: string) => {
  return password.length >= 6;
};

const isValidCompanyName = (name: string) => {
  return name.length >= 2 && name.length <= 20;
};

const generateSlug = (name: string) => {
  return name.toLowerCase()
           .replace(/[^\w\s-]/g, '')
           .replace(/\s+/g, '-');
};

export const SignUpForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    companyName: "",
  });

  const [validationErrors, setValidationErrors] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    companyName: "",
  });

  const validateForm = () => {
    const errors = {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      companyName: "",
    };

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (!isValidPassword(formData.password)) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!formData.firstName) {
      errors.firstName = "First name is required";
    }

    if (!formData.lastName) {
      errors.lastName = "Last name is required";
    }

    if (!formData.companyName) {
      errors.companyName = "Company name is required";
    } else if (!isValidCompanyName(formData.companyName)) {
      errors.companyName = "Company name must be between 2 and 20 characters";
    }

    setValidationErrors(errors);
    return !Object.values(errors).some(error => error !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const { data, error: functionError } = await supabase.functions.invoke('new-account-setup', {
        body: {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          companyName: formData.companyName
        }
      });

      if (functionError) {
        throw functionError;
      }
      
      // Sign in the user with the newly created credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) {
        throw signInError;
      }

      // Redirect to inbox
      navigate('/inbox');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            setValidationErrors({ ...validationErrors, email: "" });
          }}
          required
          placeholder="Enter your email"
          className={cn(validationErrors.email && "border-red-500")}
        />
        {validationErrors.email && (
          <p className="text-sm text-red-500">{validationErrors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => {
            setFormData({ ...formData, password: e.target.value });
            setValidationErrors({ ...validationErrors, password: "" });
          }}
          required
          placeholder="Create a password"
          className={cn(validationErrors.password && "border-red-500")}
        />
        {validationErrors.password && (
          <p className="text-sm text-red-500">{validationErrors.password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          type="text"
          value={formData.firstName}
          onChange={(e) => {
            setFormData({ ...formData, firstName: e.target.value });
            setValidationErrors({ ...validationErrors, firstName: "" });
          }}
          required
          placeholder="Enter your first name"
          className={cn(validationErrors.firstName && "border-red-500")}
        />
        {validationErrors.firstName && (
          <p className="text-sm text-red-500">{validationErrors.firstName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          type="text"
          value={formData.lastName}
          onChange={(e) => {
            setFormData({ ...formData, lastName: e.target.value });
            setValidationErrors({ ...validationErrors, lastName: "" });
          }}
          required
          placeholder="Enter your last name"
          className={cn(validationErrors.lastName && "border-red-500")}
        />
        {validationErrors.lastName && (
          <p className="text-sm text-red-500">{validationErrors.lastName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          type="text"
          value={formData.companyName}
          onChange={(e) => {
            setFormData({ ...formData, companyName: e.target.value });
            setValidationErrors({ ...validationErrors, companyName: "" });
          }}
          required
          placeholder="Enter your company name"
          className={cn(validationErrors.companyName && "border-red-500")}
        />
        {validationErrors.companyName && (
          <p className="text-sm text-red-500">{validationErrors.companyName}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || Object.values(validationErrors).some(error => error !== "")}
      >
        {loading ? "Creating Account..." : "Sign Up"}
      </Button>
    </form>
  );
}; 