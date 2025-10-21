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
  Activity,
  Ambulance,
  Sparkles,
  Award,
  TrendingUp,
} from "lucide-react"
import { Logo } from "@/components/logo"

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-md fixed top-0 w-full z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Logo />
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Features
              </a>
              <a href="#services" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Services
              </a>
              <a
                href="#testimonials"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Reviews
              </a>
              <a href="#doctors" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Doctors
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/signin">
                <Button variant="ghost" size="default">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="default" className="shadow-lg shadow-primary/20">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Sparkles className="w-4 h-4" />
                Trusted by 17,000+ Healthcare Professionals
              </div>
              <h1 className="text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] mb-6 font-[family-name:var(--font-heading)]">
                Keep doctors and loved ones <span className="text-primary">in the loop</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
                Securely share your comprehensive medical history with doctors and loved ones, for better communication
                and care. Experience healthcare management reimagined.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth/signin">
                  <Button size="lg" className="gap-2 text-base h-14 px-8 shadow-lg shadow-primary/20">
                    Get Started <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="lg" variant="outline" className="text-base h-14 px-8 bg-transparent">
                    Create Account
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-8 mt-12">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">4.9/5</span> from 2,500+ reviews
                  </p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <p className="text-2xl font-bold text-foreground font-[family-name:var(--font-heading)]">17k+</p>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 aspect-square shadow-2xl">
                <img
                  src="/professional-doctor-with-stethoscope-in-medical-of.svg"
                  alt="Healthcare Professional"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 bg-card border border-border rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
                    <Heart className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground font-[family-name:var(--font-heading)]">
                      24/7 Support
                    </p>
                    <p className="text-sm text-muted-foreground">Always here for you</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-8 -right-8 bg-card border border-border rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground font-[family-name:var(--font-heading)]">
                      Award Winning
                    </p>
                    <p className="text-sm text-muted-foreground">Best Healthcare App</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-card to-card/50 border border-border rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/20">
                <Ambulance className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3 font-[family-name:var(--font-heading)]">
                Emergency Care
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Immediate access to emergency medical services. Available 24/7 for urgent healthcare needs.
              </p>
            </div>
            <div className="bg-gradient-to-br from-card to-card/50 border border-border rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3 font-[family-name:var(--font-heading)]">
                Chamber Service
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Professional clinical services with experienced healthcare providers in modern facilities.
              </p>
            </div>
            <div className="bg-gradient-to-br from-card to-card/50 border border-border rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3 font-[family-name:var(--font-heading)]">
                Secure & Private
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Your health data is encrypted and protected with industry-leading security standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Process Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <TrendingUp className="w-4 h-4" />
              Simple Process
            </div>
            <h2 className="text-5xl font-bold text-foreground mb-6 font-[family-name:var(--font-heading)]">
              Simple, supportive search process
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Our platform makes it easy to connect with healthcare professionals and manage your medical records
              seamlessly
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                <Clock className="w-10 h-10 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4 font-[family-name:var(--font-heading)]">
                Easy to Use
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                An easy-to-use online directory that lets you search by filter and find the perfect healthcare provider
              </p>
              <a href="#" className="text-primary hover:underline inline-flex items-center gap-2 font-semibold">
                Learn More <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4 font-[family-name:var(--font-heading)]">
                Free Support
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Get what matters most from matching support on demand with our dedicated healthcare team
              </p>
              <a href="#" className="text-primary hover:underline inline-flex items-center gap-2 font-semibold">
                Learn More <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                <Video className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4 font-[family-name:var(--font-heading)]">
                Online Care
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                One-on-one matching with a licensed therapist and healthcare professional from anywhere
              </p>
              <a href="#" className="text-primary hover:underline inline-flex items-center gap-2 font-semibold">
                Learn More <ArrowRight className="w-4 h-4" />
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
                <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                  <img src="/doctor-avatar-.jpg" alt={doctor.name} className="w-full h-full object-cover" />
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
            <Link href="/auth/signin">
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
              <Link href="/auth/signin">
                <Button size="lg">Learn More</Button>
              </Link>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden bg-primary/10 aspect-[4/3]">
                <img
                  src="/doctor-patient-consultation.svg"
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
                      className="w-10 h-10 bg-primary/20 rounded-full border-2 border-card flex items-center justify-center overflow-hidden"
                    >
                      <img src="/doctor-avatar-.jpg" alt={`Doctor ${i}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary to-primary/80">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-primary-foreground mb-6 font-[family-name:var(--font-heading)]">
            Ready to get started?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-10 leading-relaxed">
            Join thousands of healthcare professionals and patients who trust our platform for better care
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/signin">
              <Button size="lg" variant="secondary" className="gap-2 text-base h-14 px-8 shadow-xl">
                Get Started <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button
                size="lg"
                variant="outline"
                className="text-base h-14 px-8 bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10"
              >
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <Logo className="mb-6" />
              <p className="text-muted-foreground leading-relaxed">
                Connecting patients with healthcare professionals for better care and healthier lives.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-6 text-lg font-[family-name:var(--font-heading)]">Product</h4>
              <ul className="space-y-3 text-muted-foreground">
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
              <h4 className="font-bold text-foreground mb-6 text-lg font-[family-name:var(--font-heading)]">Company</h4>
              <ul className="space-y-3 text-muted-foreground">
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
              <h4 className="font-bold text-foreground mb-6 text-lg font-[family-name:var(--font-heading)]">Support</h4>
              <ul className="space-y-3 text-muted-foreground">
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
          <div className="border-t border-border pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 Ukuqala Medicals. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
