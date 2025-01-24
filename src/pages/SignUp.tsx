import { SignUpForm } from "@/components/auth/SignUpForm";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const SignUp = () => {
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
          <p className="text-muted-foreground">Create your Ripple account</p>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card/50 p-8 shadow-xl backdrop-blur ring-1 ring-purple-400/10 transition-all duration-200 hover:bg-card/60 hover:ring-purple-400/20">
          <SignUpForm />
          
          <div className="mt-4 text-center">
            <Link to="/auth">
              <Button variant="ghost" className="text-purple-400 hover:text-purple-300">
                Already have an account? Sign in
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          By signing up, you agree to our{" "}
          <a href="#" className="text-purple-400 hover:text-purple-300 underline underline-offset-4">Terms of Service</a>
          {" "}and{" "}
          <a href="#" className="text-purple-400 hover:text-purple-300 underline underline-offset-4">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 