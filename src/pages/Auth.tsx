import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthError } from "@supabase/supabase-js";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignInForm {
  email: string;
  password: string;
}

const Auth = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<SignInForm>();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/inbox");
      }
      if (event === "USER_UPDATED") {
        const { error } = await supabase.auth.getSession();
        if (error) {
          setErrorMessage(getErrorMessage(error));
        }
      }
      if (event === "SIGNED_OUT") {
        setErrorMessage("");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const onSubmit = async (data: SignInForm) => {
    setIsLoading(true);
    setErrorMessage("");
    
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setErrorMessage(getErrorMessage(error));
    }
    setIsLoading(false);
  };

  const getErrorMessage = (error: AuthError) => {
    try {
      const errorBody = JSON.parse(error.message);
      if (errorBody.code === "weak_password") {
        return "Password should be at least 6 characters long.";
      }
    } catch {
      // If error.message is not JSON, proceed with normal error handling
    }

    switch (error.message) {
      case "Invalid login credentials":
        return "Invalid email or password. Please check your credentials and try again.";
      case "Email not confirmed":
        return "Please verify your email address before logging in.";
      default:
        return error.message;
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      <div className="relative w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 fill-purple-400 rounded-full" version="1.1" viewBox="0 0 19.877 19.877">
              <g>
                <g>
                  <path d="M9.938,3.403c-3.604,0-6.537,2.933-6.537,6.537s2.933,6.537,6.537,6.537s6.538-2.933,6.538-6.537    C16.476,6.336,13.542,3.403,9.938,3.403z M9.938,14.892c-2.73,0-4.952-2.222-4.952-4.952s2.222-4.952,4.952-4.952    c2.731,0,4.953,2.222,4.953,4.952S12.669,14.892,9.938,14.892z"/>
                  <path d="M9.938,0.001C4.458,0.001,0,4.459,0,9.938s4.458,9.938,9.938,9.938    c5.481,0,9.939-4.458,9.939-9.938C19.877,4.459,15.419,0.001,9.938,0.001z M9.938,18.292c-4.606,0-8.353-3.746-8.353-8.353    c0-4.606,3.747-8.353,8.353-8.353s8.353,3.747,8.353,8.353C18.291,14.545,14.544,18.292,9.938,18.292z"/>
                </g>
              </g>
            </svg>
            <h1 className="text-3xl font-regular tracking-tighter">Ripple</h1>
          </div>
          <p className="text-muted-foreground">Sign in to your account to continue</p>
        </div>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className={cn(
          "overflow-hidden rounded-lg border bg-card/50 p-8 shadow-xl backdrop-blur",
          "ring-1 ring-purple-400/10 transition-all duration-200",
          "hover:bg-card/60 hover:ring-purple-400/20"
        )}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email", { required: "Email is required" })}
                placeholder="name@example.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password", { required: "Password is required" })}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>

            <div className="text-center">
              <Link 
                to="/sign-up" 
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                Don't have an account? Sign up
              </Link>
            </div>
          </form>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          By signing in, you agree to our{" "}
          <a href="#" className="text-purple-400 hover:text-purple-300 underline underline-offset-4">Terms of Service</a>
          {" "}and{" "}
          <a href="#" className="text-purple-400 hover:text-purple-300 underline underline-offset-4">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
};

export default Auth;