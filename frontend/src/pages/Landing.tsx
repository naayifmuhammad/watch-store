import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, Wrench, Star, MapPin, Phone, Award } from "lucide-react";
import heroImage from "@/assets/hero-watches.jpg";
import logo from "@/assets/logo.png";

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Star Watch House" className="h-12 w-12" />
            <div>
              <h2 className="text-xl font-bold text-foreground">Star Watch House</h2>
              <p className="text-xs text-muted-foreground">Since 1958</p>
            </div>
          </Link>
          <div className="flex gap-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/new-request">
              <Button variant="heritage">Book Service</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Vintage watch mechanisms" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
              <Award className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium">65+ Years of Excellence</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Where Time Finds
              <span className="text-gradient-gold"> Perfect Care</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Since 1958, we've been the trusted guardians of timepieces in Karunagappally. 
              Now bringing our expertise to your doorstep with modern convenience.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link to="/new-request">
                <Button variant="heritage" size="lg" className="text-lg">
                  <Clock className="mr-2 h-5 w-5" />
                  Request Service
                </Button>
              </Link>
              <a href="#services">
                <Button variant="outline" size="lg" className="text-lg">
                  <Wrench className="mr-2 h-5 w-5" />
                  Our Services
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Heritage Story */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">A Legacy of Precision</h2>
              <p className="text-xl text-muted-foreground">Three generations of watchmaking excellence</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-full heritage-gradient flex items-center justify-center mb-4 mx-auto">
                  <Clock className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-center">1958</h3>
                <p className="text-muted-foreground text-center">
                  Established near TNP Theatre, Karunagappally, beginning a tradition of excellence
                </p>
              </div>
              
              <div className="bg-card p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mb-4 mx-auto">
                  <Star className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-center">50,000+</h3>
                <p className="text-muted-foreground text-center">
                  Timepieces restored to perfection, from vintage heirlooms to modern watches
                </p>
              </div>
              
              <div className="bg-card p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-full heritage-gradient flex items-center justify-center mb-4 mx-auto">
                  <Award className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-center">3 Generations</h3>
                <p className="text-muted-foreground text-center">
                  Family expertise passed down, serving families across generations
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Expert Watch Care Services</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive care for all types of timepieces, from everyday watches to precious heirlooms
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {services.map((service, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                <p className="text-muted-foreground">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple as 1-2-3</h2>
            <p className="text-xl text-muted-foreground">Modern convenience meets traditional craftsmanship</p>
          </div>
          
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mb-4 mx-auto text-2xl font-bold">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/new-request">
              <Button variant="heritage" size="lg">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Visit Our Heritage Store</h2>
            <div className="space-y-4 text-lg text-muted-foreground mb-8">
              <div className="flex items-center justify-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Near TNP Theatre, Karunagappally, Kollam, Kerala</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <span>Contact us for appointments</span>
              </div>
            </div>
            <p className="text-muted-foreground mb-8">
              Or enjoy the convenience of doorstep pickup and delivery with our new digital service
            </p>
            <Link to="/new-request">
              <Button variant="heritage" size="lg">
                Book a Service Request
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="mb-2">© 2025 Star Watch House. Serving Kerala since 1958.</p>
          <p className="text-sm">65+ years of excellence in watch and clock care</p>
        </div>
      </footer>
    </div>
  );
};

const services = [
  {
    icon: Clock,
    title: "Wristwatch Repair",
    description: "Expert repair and servicing for all wristwatch brands, from vintage classics to modern timepieces"
  },
  {
    icon: Clock,
    title: "Clock Services",
    description: "Comprehensive care for table clocks, wall clocks, and antique timepieces"
  },
  {
    icon: Wrench,
    title: "Battery Replacement",
    description: "Quick and professional battery replacement for quartz watches"
  },
  {
    icon: Star,
    title: "Movement Servicing",
    description: "Complete mechanical movement overhaul and regulation"
  },
  {
    icon: Wrench,
    title: "Strap & Bracelet",
    description: "Professional strap replacement and bracelet adjustment services"
  },
  {
    icon: Award,
    title: "Antique Restoration",
    description: "Specialized care for vintage and heirloom timepieces"
  }
];

const steps = [
  {
    number: "1",
    title: "Request Service",
    description: "Submit photos, videos, or voice notes describing your watch issue from home"
  },
  {
    number: "2",
    title: "Get Quote",
    description: "Receive a transparent price estimate from our expert watchmakers"
  },
  {
    number: "3",
    title: "Doorstep Service",
    description: "We pick up, repair with care, and deliver your timepiece back to you"
  }
];

export default Landing;
