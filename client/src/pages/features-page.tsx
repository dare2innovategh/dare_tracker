import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { 
  Users, 
  Menu, 
  X, 
  ArrowRight, 
  LineChart, 
  Trophy, 
  BookOpen,
  UserPlus,
  BarChart3,
  MessageCircle,
  Database,
  PieChart,
  Share2,
  Calendar,
  CheckCircle2,
  ChevronDown
} from "lucide-react";
// Use actual DARE assets
const dareLogo = "/img/dare-logo.png";
const aboutHeroImage = "/img/Yiw-about-hero.jpg";

// Mastercard color theme - matching the other pages
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

export default function FeaturesPage() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);

  // Handle scroll for nav transparency effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Feature interaction
  const handleFeatureHover = (index: number | null) => {
    setActiveFeature(index);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation Bar with transparency based on scroll - matching other pages */}
      <header 
        className={`py-4 px-4 md:px-8 backdrop-blur fixed top-0 w-full z-40 transition-all duration-300 ${
          scrollY > 50 ? "bg-white/95 shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            {/* DARE Logo */}
            <div className="h-8 w-auto">
              <img src={dareLogo} alt="DARE Logo" className="h-full w-auto" />
            </div>
            <span className="font-bold text-lg md:text-xl">YIW Tracker</span>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            <Link href="/" className="font-medium hover:text-primary transition-colors relative group">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#EB001B] to-[#F79E1B] group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/about" className="font-medium hover:text-primary transition-colors relative group">
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#EB001B] to-[#F79E1B] group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/features" className="font-medium transition-colors relative">
              <span style={{ color: THEME.primary }}>Features</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#EB001B] to-[#F79E1B]"></span>
            </Link>
            <Link href="/districts" className="font-medium hover:text-primary transition-colors relative group">
              Districts
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#EB001B] to-[#F79E1B] group-hover:w-full transition-all duration-300"></span>
            </Link>
            {user ? (
              <Link href="/dashboard">
                <Button 
                  style={{ 
                    background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                    border: "none" 
                  }}
                  className="hover:shadow-lg transition-shadow duration-300"
                >
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button
                  style={{ 
                    background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                    border: "none" 
                  }}
                  className="hover:shadow-lg transition-shadow duration-300"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md focus:outline-none"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile menu with animation */}
      <motion.div 
        initial="hidden"
        animate={isMenuOpen ? "visible" : "hidden"}
        variants={{
          visible: { opacity: 1, height: "auto", display: "block" },
          hidden: { 
            opacity: 0, 
            height: 0,
            transitionEnd: { display: "none" }
          }
        }}
        transition={{ duration: 0.3 }}
        className="md:hidden bg-white border-b shadow-lg z-30 fixed top-16 left-0 w-full"
      >
        <motion.div 
          variants={staggerContainer}
          className="px-4 py-4 space-y-4 flex flex-col"
        >
          <motion.div variants={fadeIn}>
            <Link href="/" className="py-3 block font-medium hover:text-primary transition-colors">
              Home
            </Link>
          </motion.div>
          <motion.div variants={fadeIn}>
            <Link href="/about" className="py-3 block font-medium hover:text-primary transition-colors">
              About
            </Link>
          </motion.div>
          <motion.div variants={fadeIn}>
            <Link href="/features" className="py-3 block font-medium transition-colors">
              <span style={{ color: THEME.primary }}>Features</span>
            </Link>
          </motion.div>
          <motion.div variants={fadeIn}>
            <Link href="/districts" className="py-3 block font-medium hover:text-primary transition-colors">
              Districts
            </Link>
          </motion.div>
          <motion.div variants={fadeIn}>
            {user ? (
              <Link href="/dashboard">
                <Button 
                  className="w-full"
                  style={{ 
                    background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                    border: "none" 
                  }}
                >
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button 
                  className="w-full"
                  style={{ 
                    background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                    border: "none" 
                  }}
                >
                  Sign In
                </Button>
              </Link>
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      <main className="flex-grow pt-16">
        {/* Hero Section with about hero image */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          {/* Background Image */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-70" 
              style={{ backgroundImage: `url(${aboutHeroImage})` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/40 to-black/50"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="text-center"
            >
              <h1 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                Platform <span style={{ color: THEME.accent }}>Features</span>
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
                Comprehensive tools for monitoring, tracking, and supporting youth entrepreneurship development
              </p>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div 
              className="hidden md:flex justify-center mt-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
            >
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex flex-col items-center cursor-pointer"
                onClick={() => {
                  const element = document.getElementById('core-modules');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <p className="text-sm text-white/80 mb-2">Explore features</p>
                <ChevronDown style={{ color: THEME.accent }} />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Core Modules Section with animated cards */}
        <section id="core-modules" className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeIn}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: THEME.dark }}>
                Core Modules
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                The DARE YIW Tracker platform consists of three primary modules that work together to provide comprehensive support
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-10">
              {[
                {
                  icon: <UserPlus />,
                  title: "Youth Profile Management",
                  description: "Comprehensive participant profiles to track demographic information, business details, and skills development.",
                  items: [
                    "Personal and demographic information",
                    "Business type and DARE model assignment",
                    "Training and skills database",
                    "Portfolio and work sample gallery"
                  ],
                  color: THEME.secondary
                },
                {
                  icon: <BarChart3 />,
                  title: "Business Growth Tracking",
                  description: "Monthly tracking of business metrics to monitor growth, identify challenges, and measure progress.",
                  items: [
                    "Monthly revenue and expenditure tracking",
                    "Employee and production metrics",
                    "Business challenges documentation",
                    "Growth opportunity identification"
                  ],
                  color: THEME.primary
                },
                {
                  icon: <MessageCircle />,
                  title: "Mentorship System",
                  description: "Connect participants with experienced mentors for guidance and support throughout their business journey.",
                  items: [
                    "Mentor-mentee matching system",
                    "In-platform messaging and communication",
                    "Feedback and guidance tracking",
                    "Resource sharing capabilities"
                  ],
                  color: THEME.accent
                }
              ].map((module, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  variants={{
                    hidden: { opacity: 0, y: 50 },
                    visible: { 
                      opacity: 1, 
                      y: 0,
                      transition: { 
                        delay: index * 0.2, 
                        type: "spring",
                        damping: 15,
                        stiffness: 50
                      }
                    }
                  }}
                  whileHover={{ 
                    y: -10,
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)"
                  }}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 transition-all duration-300"
                  onMouseEnter={() => handleFeatureHover(index)}
                  onMouseLeave={() => handleFeatureHover(null)}
                >
                  <div className="h-2" style={{ backgroundColor: module.color }}></div>
                  <div className="p-6 md:p-8">
                    <div className="flex items-center mb-4">
                      <div 
                        className="p-3 rounded-full mr-4 transition-all duration-300"
                        style={{ 
                          background: activeFeature === index 
                            ? `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`
                            : `${module.color}20`
                        }}
                      >
                        <motion.div
                          animate={activeFeature === index ? { rotate: 360, scale: 1.1 } : { rotate: 0, scale: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          {React.cloneElement(module.icon, { 
                            className: "h-6 w-6",
                            color: activeFeature === index ? "white" : module.color
                          })}
                        </motion.div>
                      </div>
                      <h3 className="text-xl font-bold transition-colors duration-300" 
                        style={{ color: activeFeature === index ? module.color : THEME.dark }}>
                        {module.title}
                      </h3>
                    </div>
                    
                    <p className="text-gray-600 mb-6">
                      {module.description}
                    </p>
                    
                    {activeFeature === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        {module.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" style={{ color: module.color }} />
                            <span className="text-sm text-gray-600">{item}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeIn}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: THEME.dark }}>
                Key Features
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Powerful tools designed to enhance the DARE Youth-in-Work program experience
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Real-time Analytics",
                  description: "Track business growth with intuitive charts and visualizations",
                  icon: <LineChart />,
                  color: THEME.primary
                },
                {
                  title: "Profile Management",
                  description: "Create and manage detailed youth entrepreneur profiles",
                  icon: <Users />,
                  color: THEME.secondary
                },
                {
                  title: "Mentorship System",
                  description: "Connect mentees with experienced business mentors",
                  icon: <Trophy />,
                  color: THEME.accent
                },
                {
                  title: "Resource Library",
                  description: "Access training materials and business development resources",
                  icon: <BookOpen />,
                  color: THEME.dark
                },
                {
                  title: "Performance Tracking",
                  description: "Monitor progress and growth over time with detailed metrics",
                  icon: <Calendar />,
                  color: THEME.secondary
                },
                {
                  title: "Data Export",
                  description: "Generate reports and export data for stakeholders",
                  icon: <Database />,
                  color: THEME.primary
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { delay: index * 0.1, duration: 0.5 }
                    }
                  }}
                  className="bg-white rounded-lg p-6 shadow hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-2 rounded-full mr-3" style={{ backgroundColor: feature.color + "20" }}>
                      {React.cloneElement(feature.icon, {
                        className: "h-5 w-5",
                        style: { color: feature.color }
                      })}
                    </div>
                    <h3 className="font-bold">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeIn}
              className="bg-white rounded-2xl p-8 md:p-12 shadow-xl text-center border border-gray-100"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: THEME.dark }}>Ready to Get Started?</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
                Join the DARE Youth-in-Work Tracker platform to monitor growth, connect with mentors, and access valuable resources
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                {user ? (
                  <Link href="/dashboard">
                    <Button 
                      size="lg" 
                      className="px-8 shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{ 
                        background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                        border: "none" 
                      }}
                    >
                      Go to Dashboard
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </motion.div>
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth">
                    <Button 
                      size="lg" 
                      className="px-8 shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{ 
                        background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                        border: "none" 
                      }}
                    >
                      Sign In / Register
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </motion.div>
                    </Button>
                  </Link>
                )}
                <Link href="/about">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="px-8 border-2 hover:bg-gray-50 transition-colors duration-300"
                    style={{ borderColor: THEME.primary, color: THEME.primary }}
                  >
                    Learn More About DARE
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-8 w-auto">
                  <img src={dareLogo} alt="DARE Logo" className="h-full w-auto" />
                </div>
                <span className="font-bold text-xl">YIW Tracker</span>
              </div>
              <p className="text-gray-400 text-sm">
                Comprehensive tracking platform for the Digital Access and Rural Empowerment program in Ghana.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/features" className="text-gray-400 hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/districts" className="text-gray-400 hover:text-white transition-colors">
                    Districts
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Districts</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/districts#bekwai" className="text-gray-400 hover:text-white transition-colors">
                    Bekwai
                  </Link>
                </li>
                <li>
                  <Link href="/districts#gushegu" className="text-gray-400 hover:text-white transition-colors">
                    Gushegu
                  </Link>
                </li>
                <li>
                  <Link href="/districts#lower-manya" className="text-gray-400 hover:text-white transition-colors">
                    Lower Manya
                  </Link>
                </li>
                <li>
                  <Link href="/districts#yilo-krobo" className="text-gray-400 hover:text-white transition-colors">
                    Yilo Krobo
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Account</h3>
              <ul className="space-y-2">
                {user ? (
                  <>
                    <li>
                      <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link href="/settings" className="text-gray-400 hover:text-white transition-colors">
                        Settings
                      </Link>
                    </li>
                  </>
                ) : (
                  <li>
                    <Link href="/auth" className="text-gray-400 hover:text-white transition-colors">
                      Login / Register
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} DARE YIW Tracker. All rights reserved.</p>
            <p className="mt-2 text-xs">
              Digital Access and Rural Empowerment Program for Young Women in Ghana
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}