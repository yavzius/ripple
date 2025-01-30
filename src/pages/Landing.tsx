import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, BookOpen, GraduationCap, Ticket, MessageSquare, Users,
  Sparkles, Bot, Store, Zap, ShieldCheck, Boxes
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Landing() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-[#1E1B2E] text-white overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full border-b border-white/10 bg-[#1E1B2E]/80 backdrop-blur-sm z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 fill-purple-400" viewBox="0 0 19.877 19.877">
              <g><g>
                <path d="M9.938,3.403c-3.604,0-6.537,2.933-6.537,6.537s2.933,6.537,6.537,6.537s6.538-2.933,6.538-6.537    C16.476,6.336,13.542,3.403,9.938,3.403z M9.938,14.892c-2.73,0-4.952-2.222-4.952-4.952s2.222-4.952,4.952-4.952    c2.731,0,4.953,2.222,4.953,4.952S12.669,14.892,9.938,14.892z"/>
                <path d="M9.938,0.001C4.458,0.001,0,4.459,0,9.938s4.458,9.938,9.938,9.938    c5.481,0,9.939-4.458,9.939-9.938C19.877,4.459,15.419,0.001,9.938,0.001z M9.938,18.292c-4.606,0-8.353-3.746-8.353-8.353    c0-4.606,3.747-8.353,8.353-8.353s8.353,3.747,8.353,8.353C18.291,14.545,14.544,18.292,9.938,18.292z"/>
              </g></g>
            </svg>
            <div className="font-medium text-lg tracking-tight">Ripple</div>
          </div>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <Button onClick={() => navigate("/inbox")} 
                className="bg-purple-400 text-[#1E1B2E] hover:bg-purple-400/90">
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")} 
                  className="text-white/70 hover:text-white">
                  Sign In
                </Button>
                <Button onClick={() => navigate("/sign-up")} 
                  className="bg-purple-400 text-[#1E1B2E] hover:bg-purple-400/90">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-400/10 via-purple-400/5 to-transparent" />
        <div className="container relative px-4 md:px-6">
          <div className="flex flex-col items-center space-y-8 text-center">
            <div className="inline-flex items-center rounded-full px-3 py-1 text-sm border border-purple-400/20 bg-purple-400/10 text-purple-400">
              <Sparkles className="w-4 h-4 mr-2" /> AI-Powered B2B Beauty Platform
            </div>
            <h1 className="text-4xl font-medium tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
              The modern platform for{" "}
              <span className="text-purple-400">beauty brand growth</span>
            </h1>
            <p className="text-lg text-white/60 max-w-2xl">
              Streamline your B2B operations with AI-powered tools for rep training, 
              customer support, and business growth.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/sign-up")}
              className="bg-purple-400 text-[#1E1B2E] hover:bg-purple-400/90 h-12 px-8 text-base"
            >
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* App Preview */}
      <section className="py-12 overflow-hidden">
        <div className="container px-4">
          <div className="relative rounded-xl border border-purple-400/20 bg-gradient-to-b from-purple-400/5 to-transparent backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-400/10 to-transparent opacity-50" />
            <div className="relative p-1">
              <img 
                src="/screenshot.png" 
                alt="Ripple dashboard interface" 
                className="rounded-lg w-full shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-medium">Everything you need</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              A complete suite of tools to manage your B2B beauty business
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative"
              >
                <div className="absolute -inset-px bg-gradient-to-b from-purple-400/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6 bg-purple-400/5 rounded-lg border border-purple-400/20 space-y-4 hover:bg-purple-400/[0.07] transition-colors">
                  <div className="h-10 w-10 rounded-full bg-purple-400/10 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-medium">{feature.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 border-t border-purple-400/20">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-medium">Loved by beauty brands</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Join hundreds of brands transforming their B2B operations
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="p-6 bg-purple-400/5 rounded-lg border border-purple-400/20">
                <p className="text-white/60 mb-6 text-sm leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-400/10 flex items-center justify-center text-purple-400">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{testimonial.name}</div>
                    <div className="text-white/40 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-purple-400/20">
        <div className="container px-4 md:px-6">
          <div className="relative rounded-2xl overflow-hidden border border-purple-400/20">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-purple-400/5 to-transparent" />
            <div className="relative p-12 text-center space-y-6">
              <h2 className="text-3xl font-medium">Ready to transform your B2B operations?</h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Join leading beauty brands using Ripple to streamline their B2B support and education.
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate("/sign-up")}
                className="bg-purple-400 text-[#1E1B2E] hover:bg-purple-400/90 h-12 px-8 text-base"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-purple-400/20">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-purple-400" viewBox="0 0 19.877 19.877">
                  <g><g>
                    <path d="M9.938,3.403c-3.604,0-6.537,2.933-6.537,6.537s2.933,6.537,6.537,6.537s6.538-2.933,6.538-6.537    C16.476,6.336,13.542,3.403,9.938,3.403z M9.938,14.892c-2.73,0-4.952-2.222-4.952-4.952s2.222-4.952,4.952-4.952    c2.731,0,4.953,2.222,4.953,4.952S12.669,14.892,9.938,14.892z"/>
                    <path d="M9.938,0.001C4.458,0.001,0,4.459,0,9.938s4.458,9.938,9.938,9.938    c5.481,0,9.939-4.458,9.939-9.938C19.877,4.459,15.419,0.001,9.938,0.001z M9.938,18.292c-4.606,0-8.353-3.746-8.353-8.353    c0-4.606,3.747-8.353,8.353-8.353s8.353,3.747,8.353,8.353C18.291,14.545,14.544,18.292,9.938,18.292z"/>
                  </g></g>
                </svg>
                <span className="font-medium">Ripple</span>
              </div>
              <p className="text-sm text-white/60">
                Transforming B2B beauty brand operations with intelligent support solutions.
              </p>
              <div className="text-sm text-white/40">
                © 2025 Ripple. All rights reserved.
              </div>
            </div>
            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Security", "Roadmap"]
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers", "Contact"]
              },
              {
                title: "Legal",
                links: ["Privacy", "Terms", "Security", "GDPR"]
              }
            ].map((section, i) => (
              <div key={i} className="space-y-4">
                <h4 className="font-medium text-sm">{section.title}</h4>
                <div className="space-y-3">
                  {section.links.map((link, j) => (
                    <a 
                      key={j}
                      href="#" 
                      className="block text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: "AI-Powered Support",
    description: "Let AI handle routine inquiries while your team focuses on high-value interactions.",
    icon: Bot
  },
  {
    title: "Shopify Integration",
    description: "Seamlessly connect your Shopify store for unified B2B operations.",
    icon: Store
  },
  {
    title: "Real-time Analytics",
    description: "Track performance metrics and customer satisfaction in real-time.",
    icon: BarChart3
  },
  {
    title: "Rep Training",
    description: "Comprehensive training tools to educate and empower your sales team.",
    icon: GraduationCap
  },
  {
    title: "Fast Implementation",
    description: "Get up and running quickly with our guided onboarding process.",
    icon: Zap
  },
  {
    title: "Enterprise Security",
    description: "Bank-grade security to protect your business and customer data.",
    icon: ShieldCheck
  }
];

const testimonials = [
  {
    quote: "Ripple has transformed how we manage our B2B relationships. The AI-powered support has reduced our response time by 80%.",
    name: "Sarah Johnson",
    role: "CEO at BeautyGlow"
  },
  {
    quote: "The rep training features have made onboarding new sales team members incredibly efficient. Our reps are more knowledgeable than ever.",
    name: "Michael Chen",
    role: "Sales Director at PureBeauty"
  },
  {
    quote: "The Shopify integration is seamless. We can now manage our B2B and B2C operations from one platform.",
    name: "Emma Davis",
    role: "Operations Manager at Luminous"
  }
]; 