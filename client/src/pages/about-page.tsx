import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { 
  Users, 
  Menu, 
  X, 
  Upload, 
  Award,
  Globe,
  Smartphone,
  BookOpen,
  Building,
  Lightbulb,
  ChevronRight,
  ArrowRight,
  Check,
  Calendar
} from "lucide-react";
// Use actual DARE assets
const dareLogo = "/img/dare-logo.png";
const aboutHeroImg = "/img/Yiw-about-hero.jpg";

// Mastercard color theme - matching the home page
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

export default function AboutPage() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activePhase, setActivePhase] = useState<number | null>(null);

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

  const slideInFromRight = {
    hidden: { x: 50, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  const slideInFromLeft = {
    hidden: { x: -50, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  // Timeline interaction
  const handlePhaseHover = (phase: number | null) => {
    setActivePhase(phase);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation Bar with transparency based on scroll - matching home page */}
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
            <Link href="/about" className="font-medium transition-colors relative">
              <span style={{ color: THEME.primary }}>About</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#EB001B] to-[#F79E1B]"></span>
            </Link>
            <Link href="/features" className="font-medium hover:text-primary transition-colors relative group">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#EB001B] to-[#F79E1B] group-hover:w-full transition-all duration-300"></span>
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
            <Link href="/about" className="py-3 block font-medium transition-colors">
              <span style={{ color: THEME.primary }}>About</span>
            </Link>
          </motion.div>
          <motion.div variants={fadeIn}>
            <Link href="/features" className="py-3 block font-medium hover:text-primary transition-colors">
              Features
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
        {/* Hero Section with the new hero image */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5 overflow-hidden">
            <div className="absolute -left-10 top-10 w-64 h-64 rounded-full" style={{ backgroundColor: THEME.secondary }}></div>
            <div className="absolute right-20 top-40 w-96 h-96 rounded-full" style={{ backgroundColor: THEME.accent }}></div>
            <div className="absolute left-1/3 bottom-0 w-80 h-80 rounded-full" style={{ backgroundColor: THEME.primary }}></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="text-left"
              >
                <h1 className="text-3xl md:text-5xl font-bold mb-6">
                  About the <span style={{ color: THEME.primary }}>DARE</span> Program
                </h1>
                <p className="text-lg md:text-xl text-gray-600">
                  Empowering young women through digital access, skills training, and entrepreneurship support in rural Ghana
                </p>
                <div className="mt-8">
                  <Link href="#program-overview">
                    <Button
                      style={{ 
                        background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                        border: "none" 
                      }}
                      className="hover:shadow-lg transition-shadow duration-300"
                    >
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
              
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0, scale: 0.9 },
                  visible: { 
                    opacity: 1, 
                    scale: 1,
                    transition: { delay: 0.2, duration: 0.8 }
                  }
                }}
                className="relative"
              >
                <div className="rounded-2xl overflow-hidden shadow-xl">
                  <img 
                    src={aboutHeroImg} 
                    alt="DARE Program Participants" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Program Overview Section */}
        <section id="program-overview" className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={slideInFromLeft}
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-6">
                  Digital Access and Rural Empowerment
                </h2>
                <div className="space-y-6">
                  <p className="text-gray-600">
                    The Digital Access and Rural Empowerment (DARE) program is a groundbreaking initiative 
                    focused on enhancing the digital and business skills of young women in rural Ghana. 
                    Through targeted training, mentorship, and resource provision, DARE empowers these women 
                    to establish sustainable businesses in their communities.
                  </p>
                  <p className="text-gray-600">
                    Our Youth-in-Work (YIW) Tracker is a specialized platform designed to monitor the progress 
                    of DARE participants across four key districts in Ghana. It provides comprehensive tracking 
                    tools for business growth, skills development, and mentorship connections.
                  </p>
                  <div className="mt-8">
                    <h3 className="font-bold text-xl mb-4">Key Program Features</h3>
                    <div className="space-y-3">
                      {[
                        "Digital skills training for rural youth",
                        "Business development and entrepreneurship support",
                        "Mentorship and networking opportunities",
                        "Financial inclusion and access to resources",
                        "Ongoing progress tracking and growth monitoring"
                      ].map((feature, idx) => (
                        <div key={idx} className="flex items-start space-x-3">
                          <div className="p-1 rounded-full" style={{ backgroundColor: THEME.primary + "20" }}>
                            <Check className="h-4 w-4" style={{ color: THEME.primary }} />
                          </div>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={slideInFromRight}
                className="relative"
              >
                {/* Decorative elements */}
                <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-20" style={{ backgroundColor: THEME.secondary }}></div>
                <div className="absolute -bottom-5 -right-5 w-24 h-24 rounded-full opacity-20" style={{ backgroundColor: THEME.accent }}></div>
                
                {/* Content card */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-xl relative z-10">
                  <div 
                    className="p-6 text-white" 
                    style={{ 
                      background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`
                    }}
                  >
                    <h3 className="text-xl font-bold mb-3">Program Impact</h3>
                    <p className="opacity-90">Transforming lives and communities through digital empowerment</p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-2" style={{ color: THEME.primary }}>4</div>
                        <div className="text-sm text-gray-600">Target Districts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-2" style={{ color: THEME.secondary }}>8</div>
                        <div className="text-sm text-gray-600">Young Entrepreneurs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-2" style={{ color: THEME.accent }}>4</div>
                        <div className="text-sm text-gray-600">Dedicated Mentors</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-2" style={{ color: THEME.dark }}>18</div>
                        <div className="text-sm text-gray-600">Months Duration</div>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold mb-3">Program Focus Areas</h4>
                      <div className="space-y-2">
                        {[
                          {
                            icon: <Smartphone />,
                            text: "Digital literacy and tech skills"
                          },
                          {
                            icon: <Building />,
                            text: "Business growth and sustainability"
                          },
                          {
                            icon: <Users />,
                            text: "Community development impact"
                          }
                        ].map((pillar, idx) => (
                          <div key={idx} className="flex items-center space-x-3">
                            <div className="p-2 rounded-full" style={{ backgroundColor: THEME.primary + "15" }}>
                              {React.cloneElement(pillar.icon, { className: "h-6 w-6" })}
                            </div>
                            <span className="text-gray-700">{pillar.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Program Timeline Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Program Timeline and Phases
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                The DARE program is structured as an 18-month initiative with distinct phases 
                focused on different aspects of participant development and business growth
              </p>
            </motion.div>

            <div className="relative mt-20">
              {/* Timeline line for desktop */}
              <div className="absolute top-12 left-[50%] transform -translate-x-1/2 h-1 w-[80%] bg-gray-200 z-0 hidden md:block"></div>
              
              {/* Timeline line for mobile */}
              <div className="absolute top-0 bottom-0 left-[20px] w-1 bg-gray-200 z-0 md:hidden"></div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    phase: "Phase 1",
                    title: "Training & Onboarding",
                    duration: "Months 1-4",
                    description: "Initial digital skills training, business fundamentals, and participant onboarding to the YIW Tracker platform.",
                    icon: <BookOpen className="h-6 w-6" />,
                    color: THEME.secondary
                  },
                  {
                    phase: "Phase 2",
                    title: "Business Development",
                    duration: "Months 5-12",
                    description: "Intensive business development support, mentorship matching, and regular progress tracking.",
                    icon: <Building className="h-6 w-6" />,
                    color: THEME.primary
                  },
                  {
                    phase: "Phase 3",
                    title: "Growth & Sustainability",
                    duration: "Months 13-18",
                    description: "Focus on business growth, expansion strategies, and development of long-term sustainability plans.",
                    icon: <Lightbulb className="h-6 w-6" />,
                    color: THEME.accent
                  }
                ].map((phase, idx) => (
                  <motion.div
                    key={idx}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.4 }}
                    variants={{
                      hidden: { y: 50, opacity: 0 },
                      visible: { 
                        y: 0, 
                        opacity: 1,
                        transition: { delay: idx * 0.2, duration: 0.5 }
                      }
                    }}
                    className="relative"
                    onMouseEnter={() => handlePhaseHover(idx)}
                    onMouseLeave={() => handlePhaseHover(null)}
                  >
                    {/* Timeline point for desktop */}
                    <div 
                      className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 md:block hidden ${
                        activePhase === idx ? 'scale-125' : ''
                      }`}
                      style={{ 
                        backgroundColor: phase.color,
                        boxShadow: activePhase === idx ? `0 0 0 8px ${phase.color}20` : 'none'
                      }}
                    >
                      {idx + 1}
                    </div>
                    
                    {/* Timeline point for mobile */}
                    <div 
                      className={`absolute top-8 left-[20px] transform -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 md:hidden ${
                        activePhase === idx ? 'scale-125' : ''
                      }`}
                      style={{ 
                        backgroundColor: phase.color,
                        boxShadow: activePhase === idx ? `0 0 0 8px ${phase.color}20` : 'none'
                      }}
                    >
                      {idx + 1}
                    </div>
                    
                    <div 
                      className={`mt-16 md:ml-0 ml-14 bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${
                        activePhase === idx ? 'shadow-xl md:translate-y-[-8px]' : ''
                      }`}
                      style={{ borderTop: `3px solid ${phase.color}` }}
                    >
                      <div className="p-6">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: phase.color + "15" }}>
                            {React.cloneElement(phase.icon, { style: { color: phase.color } })}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg" style={{ color: phase.color }}>{phase.phase}</h3>
                          </div>
                        </div>
                        <h4 className="text-lg font-semibold mb-1">{phase.title}</h4>
                        <div className="flex items-center space-x-2 mb-3 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>{phase.duration}</span>
                        </div>
                        <p className="text-gray-600">{phase.description}</p>
                        
                        {activePhase === idx && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-gray-100"
                          >
                            <h5 className="font-medium mb-2 text-sm">Key Activities:</h5>
                            <ul className="space-y-1 text-sm text-gray-600">
                              {idx === 0 ? [
                                "Digital literacy workshops",
                                "Business model canvas development",
                                "Platform onboarding and training",
                                "Initial mentorship matching"
                              ] : idx === 1 ? [
                                "Regular business growth tracking",
                                "Specialized skill development",
                                "Market access facilitation",
                                "Ongoing mentorship and guidance"
                              ] : [
                                "Business expansion strategies",
                                "Advanced financial management",
                                "Community impact assessment",
                                "Long-term sustainability planning"
                              ]}
                            </ul>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Districts & Target Areas */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="max-w-3xl mx-auto text-center mb-16"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Program Districts
              </h2>
              <p className="text-lg text-gray-600">
                The DARE program currently operates in four target districts across Ghana, 
                each with specific focus areas and entrepreneurial support tailored to 
                community needs.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  name: "Bekwai",
                  region: "Ashanti Region",
                  entrepreneurs: 2,
                  focusAreas: ["Food processing", "Textile & Fashion", "Digital services"],
                  color: THEME.secondary
                },
                {
                  name: "Gushegu",
                  region: "Northern Region",
                  entrepreneurs: 2,
                  focusAreas: ["Agriculture", "Crafts & Textiles", "Food services"],
                  color: THEME.primary
                },
                {
                  name: "Lower Manya",
                  region: "Eastern Region",
                  entrepreneurs: 2,
                  focusAreas: ["Retail", "Food processing", "Beauty & wellness"],
                  color: THEME.accent
                },
                {
                  name: "Yilo Krobo",
                  region: "Eastern Region",
                  entrepreneurs: 2,
                  focusAreas: ["Beadwork", "Fashion", "Agricultural processing"],
                  color: THEME.dark
                }
              ].map((district, idx) => (
                <motion.div
                  key={idx}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.4 }}
                  variants={{
                    hidden: { y: 30, opacity: 0 },
                    visible: { 
                      y: 0, 
                      opacity: 1,
                      transition: { delay: idx * 0.1, duration: 0.5 }
                    }
                  }}
                  className="bg-white rounded-xl overflow-hidden shadow-lg group hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                  onClick={() => {
                    // Navigate to the districts page and scroll to the specific district section
                    window.location.href = `/districts#district-${idx}`;
                  }}
                >
                  <div 
                    className="h-2"
                    style={{ backgroundColor: district.color }}
                  ></div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-1">{district.name}</h3>
                    <p className="text-gray-500 text-sm mb-4">{district.region}</p>
                    
                    <div className="flex items-center space-x-2 mb-4">
                      <Users className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">{district.entrepreneurs} Young Entrepreneurs</span>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Business Focus Areas:</h4>
                      <ul className="space-y-1">
                        {district.focusAreas.map((area, areaIdx) => (
                          <li key={areaIdx} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: district.color }}></div>
                            <span className="text-sm text-gray-600">{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-6">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full group border-gray-200 hover:border-gray-300 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to districts page and specify anchor
                          // This will navigate and scroll to the element with id="district-{idx}"
                          window.location.href = `/districts#district-${idx}`;
                        }}
                      >
                        <span>View Details</span>
                        <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
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
              viewport={{ once: true }}
              variants={fadeIn}
              className="bg-white rounded-2xl p-8 md:p-12 shadow-xl text-center border border-gray-100"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: THEME.dark }}>Ready to Explore the Program?</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
                Learn more about the DARE Youth-in-Work program or access your dashboard to track participant progress
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
                <Link href="/features">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="px-8 border-2 hover:bg-gray-50 transition-colors duration-300"
                    style={{ borderColor: THEME.primary, color: THEME.primary }}
                  >
                    Explore Platform Features
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
                  <Link href="/districts#district-0" className="text-gray-400 hover:text-white transition-colors">
                    Bekwai
                  </Link>
                </li>
                <li>
                  <Link href="/districts#district-1" className="text-gray-400 hover:text-white transition-colors">
                    Gushegu
                  </Link>
                </li>
                <li>
                  <Link href="/districts#district-2" className="text-gray-400 hover:text-white transition-colors">
                    Lower Manya
                  </Link>
                </li>
                <li>
                  <Link href="/districts#district-3" className="text-gray-400 hover:text-white transition-colors">
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