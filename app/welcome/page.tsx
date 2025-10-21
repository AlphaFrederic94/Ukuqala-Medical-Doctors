import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Heart,
  Shield,
  Clock,
  Users,
  Video,
  CheckCircle2,
  Star,
  ArrowRight,
  Stethoscope,
  Activity,
  Ambulance,
} from "lucide-react"

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">HealthCare</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#services" className="text-muted-foreground hover:text-foreground transition-colors">
                Services
              </a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                Reviews
              </a>
              <a href="#doctors" className="text-muted-foreground hover:text-foreground transition-colors">
                Doctors
              </a>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                Keep doctors and loved ones in the loop
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Securely share your comprehensive medical history with doctors and loved ones, for better communication
                and care.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard">
                  <Button size="lg" className="gap-2">
                    Get Started <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden bg-primary/10 aspect-square">
                <img
                  src="/professional-doctor-with-stethoscope-in-medical-of.jpg"
                  alt="Healthcare Professional"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">24/7 Support</p>
                    <p className="text-xs text-muted-foreground">Always here for you</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Features */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Ambulance className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Emergency Care</h3>
              <p className="text-muted-foreground">Must be at least 18+ years old to register</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Activity className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Chamber Service</h3>
              <p className="text-muted-foreground">Clinical services must be real person</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Hospitality</h3>
              <p className="text-muted-foreground">Integrated with real person</p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Process Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Simple, supportive search process</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform makes it easy to connect with healthcare professionals and manage your medical records
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Easy to Use</h3>
              <p className="text-muted-foreground mb-4">
                An easy-to-use online directory that lets you search by filter
              </p>
              <a href="#" className="text-primary hover:underline inline-flex items-center gap-1">
                See More <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Free Support</h3>
              <p className="text-muted-foreground mb-4">Get what matters most from matching support on demand</p>
              <a href="#" className="text-primary hover:underline inline-flex items-center gap-1">
                See More <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Online Care</h3>
              <p className="text-muted-foreground mb-4">One-on-one matching with a licensed therapist</p>
              <a href="#" className="text-primary hover:underline inline-flex items-center gap-1">
                See More <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Hear our partners' opinions</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Julie Czyzewska",
                role: "CEO, PH Services",
                text: "We highly appreciate the quality of information's technology, ease of deployment and the outstanding ability to",
                rating: 5,
              },
              {
                name: "Dr. Matthias Kuss",
                role: "Head of Health Innovation",
                text: "Throughout our engagement we continue to be impressed with informatica's investment and the level of provided",
                rating: 5,
              },
              {
                name: "Ben Blasner",
                role: "CMO, Soft tech",
                text: "Informatica has been instrumental in our engagement. Our engagement",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">{testimonial.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Qualified Doctors Section */}
      <section id="doctors" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold mb-2">QUALIFIED DOCTORS</p>
            <h2 className="text-4xl font-bold text-foreground mb-4">Keep doctors and loved ones in the loop</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Securely share your comprehensive medical history with doctors and loved ones, for better communication
              and care.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { name: "Dr. Mason Smith", specialty: "Cardiologist", patients: "1221 Patients", rating: 4.9 },
              { name: "Dr. Christine", specialty: "Pediatrician", patients: "1004 Patients", rating: 4.8 },
              { name: "Dr. William Stan", specialty: "Cardiologist", patients: "1150 Patients", rating: 4.9 },
              { name: "Dr. Henderson", specialty: "Orthopedics", patients: "891 Patients", rating: 4.7 },
            ].map((doctor, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <img
                    src={`/professional-team.png?height=80&width=80&query=professional ${doctor.specialty} doctor portrait`}
                    alt={doctor.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-semibold text-foreground text-center mb-1">{doctor.name}</h3>
                <p className="text-sm text-muted-foreground text-center mb-2">{doctor.specialty}</p>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span className="text-sm font-semibold text-foreground">{doctor.rating}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">{doctor.patients}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/dashboard">
              <Button size="lg">Contact Us</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Best Care Section */}
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-primary font-semibold mb-2">WELCOME TO HEALTHCARE</p>
              <h2 className="text-4xl font-bold text-foreground mb-6">Best Care For Your Good Health</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Securely share your comprehensive medical history with doctors and loved ones, for better communication
                and care.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-foreground">Appointments frequenting ut molestias</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-foreground">Voluptatem quia voluptas sit aspernatur</p>
                </div>
              </div>
              <Link href="/dashboard">
                <Button size="lg">Learn More</Button>
              </Link>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden bg-primary/10 aspect-[4/3]">
                <img
                  src="/doctor-patient-consultation.png"
                  alt="Healthcare Consultation"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-card border border-border rounded-xl p-4 shadow-lg">
                <p className="text-sm font-semibold text-foreground mb-2">Available Doctors</p>
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 bg-primary/20 rounded-full border-2 border-card flex items-center justify-center"
                    >
                      <img
                        src={`/doctor-avatar-.jpg?height=40&width=40&query=doctor avatar ${i}`}
                        alt={`Doctor ${i}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">Ready to get started?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of healthcare professionals and patients who trust our platform
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">HealthCare</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Connecting patients with healthcare professionals for better care.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 HealthCare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
