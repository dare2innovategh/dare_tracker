import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  LineChart,
  Trophy,
  BookOpen,
  Menu,
  X,
  ArrowRight,
  Upload,
  BarChart3,
  MapPin,
  ChevronDown,
} from "lucide-react";
// Use actual DARE assets
const dareLogo = "/img/dare-logo.png";
const heroImage = "/img/Yiw-hero.jpg";

// Mastercard color theme
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

export default function HomePage() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  
  // Define the type for stats data
  interface DashboardStats {
    activeParticipants: number;
    activeBusinesses: number;
    mentorshipSessions: number;
    districts: string[];
    mentorsCount: number;
    districtCounts: Record<string, number>;
  }

  // Fetch real-time statistics from the server
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
    staleTime: 60000, // 1 minute
  });

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
      transition: { duration: 0.6 },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const slideInFromRight = {
    hidden: { x: 50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  // Card hover animation for features
  const handleFeatureHover = (index: number | null) => {
    setHoveredFeature(index);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation Bar with transparency based on scroll */}
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
            <span className="font-bold text-lg md:text-xl">
              DARE YIW Tracker
            </span>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            <Link
              href="/"
              className="font-medium hover:text-primary transition-colors relative group"
            >
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#EB001B] to-[#F79E1B] group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/about"
              className="font-medium hover:text-primary transition-colors relative group"
            >
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#EB001B] to-[#F79E1B] group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/features"
              className="font-medium hover:text-primary transition-colors relative group"
            >
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#EB001B] to-[#F79E1B] group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/districts"
              className="font-medium hover:text-primary transition-colors relative group"
            >
              Districts
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#EB001B] to-[#F79E1B] group-hover:w-full transition-all duration-300"></span>
            </Link>
            {user ? (
              <Link href="/dashboard">
                <Button
                  style={{
                    background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                    border: "none",
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
                    border: "none",
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
            transitionEnd: { display: "none" },
          },
        }}
        transition={{ duration: 0.3 }}
        className="md:hidden bg-white border-b shadow-lg z-30 fixed top-16 left-0 w-full"
      >
        <motion.div
          variants={staggerContainer}
          className="px-4 py-4 space-y-4 flex flex-col"
        >
          <motion.div variants={fadeIn}>
            <Link
              href="/"
              className="py-3 block font-medium hover:text-primary transition-colors"
            >
              Home
            </Link>
          </motion.div>
          <motion.div variants={fadeIn}>
            <Link
              href="/about"
              className="py-3 block font-medium hover:text-primary transition-colors"
            >
              About
            </Link>
          </motion.div>
          <motion.div variants={fadeIn}>
            <Link
              href="/features"
              className="py-3 block font-medium hover:text-primary transition-colors"
            >
              Features
            </Link>
          </motion.div>
          <motion.div variants={fadeIn}>
            <Link
              href="/districts"
              className="py-3 block font-medium hover:text-primary transition-colors"
            >
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
                    border: "none",
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
                    border: "none",
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
        {/* Hero Section with animated elements */}
        <section className="py-20 md:py-32 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5 overflow-hidden">
            <div
              className="absolute -left-10 top-10 w-64 h-64 rounded-full"
              style={{ backgroundColor: THEME.secondary }}
            ></div>
            <div
              className="absolute right-20 top-40 w-96 h-96 rounded-full"
              style={{ backgroundColor: THEME.accent }}
            ></div>
            <div
              className="absolute left-1/3 bottom-0 w-80 h-80 rounded-full"
              style={{ backgroundColor: THEME.primary }}
            ></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="space-y-6"
              >
                <motion.h1
                  variants={fadeIn}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                >
                  Digital Access for{" "}
                  <span style={{ color: THEME.primary }}>
                    Rural Empowerment
                  </span>
                </motion.h1>
                <motion.p
                  variants={fadeIn}
                  className="text-lg md:text-xl text-gray-600"
                >
                  Supporting young women in business with comprehensive
                  tracking, mentorship, and growth analytics.
                </motion.p>
                <motion.div
                  variants={fadeIn}
                  className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4"
                >
                  {user ? (
                    <Link href="/dashboard">
                      <Button
                        size="lg"
                        className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                          border: "none",
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
                        className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                          border: "none",
                        }}
                      >
                        Get Started
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </motion.div>
                      </Button>
                    </Link>
                  )}
                  <Link href="/#about">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto border-2 hover:bg-gray-50 transition-colors duration-300"
                      style={{
                        borderColor: THEME.primary,
                        color: THEME.primary,
                      }}
                    >
                      Learn More
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={slideInFromRight}
                className="relative"
              >
                {/* Hero Image Container */}
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  {/* Light overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#EB001B]/20 to-[#F79E1B]/20 mix-blend-multiply z-10"></div>
                  
                  {/* Hero Image */}
                  <img 
                    src={heroImage} 
                    alt="DARE Program Youth in Work participant with sewing machine" 
                    className="w-full h-auto object-cover"
                  />
                  
                  {/* Features cards overlay on bottom right */}
                  <motion.div
                    className="absolute bottom-4 right-4 z-20 flex flex-wrap gap-2 justify-end max-w-[180px]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    {[
                      {
                        icon: <Users />,
                        title: "Youth Profiles",
                      },
                      {
                        icon: <LineChart />,
                        title: "Business Growth",
                      },
                      {
                        icon: <Trophy />,
                        title: "Mentorship",
                      },
                      {
                        icon: <BookOpen />,
                        title: "Resources",
                      },
                    ].map((item, index) => (
                      <motion.div
                        key={item.title}
                        whileHover={{
                          scale: 1.05,
                          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                        }}
                        className="bg-white/90 backdrop-blur-sm rounded-lg p-2 flex flex-col items-center text-center shadow-md transition-all duration-300 hover:bg-white w-[80px] h-[80px]"
                      >
                        <div
                          className="p-2 rounded-full mb-1 relative overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${index % 2 === 0 ? THEME.secondary : THEME.primary} 0%, ${THEME.accent} 100%)`,
                          }}
                        >
                          <motion.div
                            className="text-white"
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                          >
                            {React.cloneElement(item.icon, {
                              className: "h-4 w-4",
                            })}
                          </motion.div>
                        </div>
                        <h3 className="font-semibold text-xs">{item.title}</h3>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section - Live Data */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Our Impact</h2>
              <p className="text-gray-600">Real-time program statistics and milestones</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Stat Card 1 - Youth Participants */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-all"
              >
                <div className="inline-flex items-center justify-center rounded-full w-12 h-12 mb-4" 
                  style={{ background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 100%)` }}>
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Active Participants</h3>
                {isLoadingStats ? (
                  <div className="h-10 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-t-primary rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <p className="text-3xl font-bold" style={{ color: THEME.primary }}>
                    {stats?.activeParticipants || 0}
                  </p>
                )}
                <p className="text-gray-500 text-sm mt-1">Young entrepreneurs</p>
              </motion.div>

              {/* Stat Card 2 - Businesses */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-all"
              >
                <div className="inline-flex items-center justify-center rounded-full w-12 h-12 mb-4" 
                  style={{ background: `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.accent} 100%)` }}>
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Active Businesses</h3>
                {isLoadingStats ? (
                  <div className="h-10 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-t-primary rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <p className="text-3xl font-bold" style={{ color: THEME.accent }}>
                    {stats?.activeBusinesses || 0}
                  </p>
                )}
                <p className="text-gray-500 text-sm mt-1">Growing enterprises</p>
              </motion.div>

              {/* Stat Card 3 - Mentors */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-all"
              >
                <div className="inline-flex items-center justify-center rounded-full w-12 h-12 mb-4" 
                  style={{ background: `linear-gradient(135deg, ${THEME.accent} 0%, ${THEME.dark} 100%)` }}>
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Mentors</h3>
                {isLoadingStats ? (
                  <div className="h-10 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-t-primary rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <p className="text-3xl font-bold" style={{ color: THEME.dark }}>
                    {stats?.mentorsCount || 0}
                  </p>
                )}
                <p className="text-gray-500 text-sm mt-1">Experienced guides</p>
              </motion.div>

              {/* Stat Card 4 - Sessions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-all"
              >
                <div className="inline-flex items-center justify-center rounded-full w-12 h-12 mb-4" 
                  style={{ background: `linear-gradient(135deg, ${THEME.dark} 0%, ${THEME.secondary} 100%)` }}>
                  <LineChart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Mentorship Sessions</h3>
                {isLoadingStats ? (
                  <div className="h-10 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-t-primary rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <p className="text-3xl font-bold" style={{ color: THEME.secondary }}>
                    {stats?.mentorshipSessions || 0}
                  </p>
                )}
                <p className="text-gray-500 text-sm mt-1">Business consultations</p>
              </motion.div>
            </div>

            {/* Districts Map/Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-12 bg-white p-6 rounded-lg shadow-md"
            >
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-6 md:mb-0 md:mr-8">
                  <h3 className="text-xl font-bold mb-3">Active Districts</h3>
                  <div className="space-y-2">
                    {isLoadingStats ? (
                      <div className="h-20 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-t-primary rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      stats?.districts?.map((district: string, index: number) => (
                        <div 
                          key={district} 
                          className="flex items-center"
                        >
                          <MapPin 
                            className="mr-2 h-5 w-5" 
                            style={{ color: index % 2 === 0 ? THEME.primary : THEME.secondary }} 
                          />
                          <span>{district}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex-1 max-w-md">
                  <div className="rounded-lg overflow-hidden h-48 bg-gray-100 relative">
                    {/* Map visualization placeholder */}
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                      <div className="text-center px-4">
                        <p className="font-medium">District Map</p>
                        <p className="text-sm text-gray-500 mt-1">Geographical distribution across Ghana</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* About Section */}
        <section
          id="about"
          className="py-20 bg-gray-50 relative overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold mb-4"
              >
                About{" "}
                <span style={{ color: THEME.primary }}>DARE YIW Tracker</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-xl text-gray-600 max-w-3xl mx-auto"
              >
                A comprehensive platform designed to empower young women in
                business across Ghana's rural communities
              </motion.p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
              >
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <div
                    className="p-16 text-white relative"
                    style={{
                      background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                    }}
                  >
                    <div className="absolute top-0 left-0 w-full h-full opacity-20">
                      <div className="absolute top-5 right-5 w-40 h-40 rounded-full bg-white"></div>
                      <div className="absolute bottom-10 left-10 w-24 h-24 rounded-full bg-white"></div>
                    </div>
                    <h3 className="text-2xl font-bold mb-4 relative z-10">
                      Digital Access and Rural Empowerment
                    </h3>
                    <p className="text-lg opacity-90 relative z-10">
                      DARE is a groundbreaking initiative focused on enhancing
                      the digital and business skills of young women in rural Ghana
                    </p>
                  </div>
                  <div className="bg-white p-8">
                    <p className="text-gray-700 mb-6">
                      The DARE YIW Tracker platform helps monitor the progress of
                      participants across four districts in Ghana, focusing on business
                      growth, skills development, and mentorship connections.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <div
                          className="p-2 rounded-full mr-3"
                          style={{ backgroundColor: THEME.secondary + "20" }}
                        >
                          <Users
                            className="h-5 w-5"
                            style={{ color: THEME.secondary }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {isLoadingStats ? (
                            <span className="inline-flex items-center">
                              <div className="w-4 h-4 mr-2 border-2 border-t-primary rounded-full animate-spin"></div>
                              Loading...
                            </span>
                          ) : (
                            `${stats?.activeParticipants || 0} Youth Participants`
                          )}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div
                          className="p-2 rounded-full mr-3"
                          style={{ backgroundColor: THEME.primary + "20" }}
                        >
                          <MapPin
                            className="h-5 w-5"
                            style={{ color: THEME.primary }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {isLoadingStats ? (
                            <span className="inline-flex items-center">
                              <div className="w-4 h-4 mr-2 border-2 border-t-primary rounded-full animate-spin"></div>
                              Loading...
                            </span>
                          ) : (
                            `${stats?.districts?.length || 0} Districts`
                          )}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div
                          className="p-2 rounded-full mr-3"
                          style={{ backgroundColor: THEME.accent + "20" }}
                        >
                          <Trophy
                            className="h-5 w-5"
                            style={{ color: THEME.accent }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {isLoadingStats ? (
                            <span className="inline-flex items-center">
                              <div className="w-4 h-4 mr-2 border-2 border-t-primary rounded-full animate-spin"></div>
                              Loading...
                            </span>
                          ) : (
                            `${stats?.mentorsCount || 0} Expert Mentors`
                          )}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div
                          className="p-2 rounded-full mr-3"
                          style={{ backgroundColor: THEME.dark + "20" }}
                        >
                          <Upload
                            className="h-5 w-5"
                            style={{ color: THEME.dark }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {isLoadingStats ? (
                            <span className="inline-flex items-center">
                              <div className="w-4 h-4 mr-2 border-2 border-t-primary rounded-full animate-spin"></div>
                              Loading...
                            </span>
                          ) : (
                            `${stats?.mentorshipSessions || 0} Mentorship Sessions`
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div>
                  <h3
                    className="text-xl font-bold mb-3 flex items-center"
                    style={{ color: THEME.primary }}
                  >
                    <span
                      className="inline-block w-8 h-8 rounded-full text-white text-center leading-8 mr-3"
                      style={{ backgroundColor: THEME.primary }}
                    >
                      1
                    </span>
                    Youth in Work Profile Tracking
                  </h3>
                  <p className="text-gray-600 pl-11">
                    Comprehensive profiles for each participant capturing business
                    details, skills, and personal development goals. Track progress
                    and growth over time.
                  </p>
                </div>

                <div>
                  <h3
                    className="text-xl font-bold mb-3 flex items-center"
                    style={{ color: THEME.secondary }}
                  >
                    <span
                      className="inline-block w-8 h-8 rounded-full text-white text-center leading-8 mr-3"
                      style={{ backgroundColor: THEME.secondary }}
                    >
                      2
                    </span>
                    Business Growth Tracking
                  </h3>
                  <p className="text-gray-600 pl-11">
                    Monitor monthly business metrics including revenue, expenses,
                    profit margins, employee growth, and market penetration to
                    measure success and identify areas for improvement.
                  </p>
                </div>

                <div>
                  <h3
                    className="text-xl font-bold mb-3 flex items-center"
                    style={{ color: THEME.accent }}
                  >
                    <span
                      className="inline-block w-8 h-8 rounded-full text-white text-center leading-8 mr-3"
                      style={{ backgroundColor: THEME.accent }}
                    >
                      3
                    </span>
                    Mentorship Connection
                  </h3>
                  <p className="text-gray-600 pl-11">
                    Connect youth participants with experienced business mentors
                    in their district for guidance, advice, and support throughout
                    their entrepreneurial journey.
                  </p>
                </div>

                <div>
                  <h3
                    className="text-xl font-bold mb-3 flex items-center"
                    style={{ color: THEME.dark }}
                  >
                    <span
                      className="inline-block w-8 h-8 rounded-full text-white text-center leading-8 mr-3"
                      style={{ backgroundColor: THEME.dark }}
                    >
                      4
                    </span>
                    Data-Driven Insights
                  </h3>
                  <p className="text-gray-600 pl-11">
                    Generate comprehensive reports and analytics to understand
                    trends, measure program effectiveness, and make informed
                    decisions for continuous improvement.
                  </p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="mt-20 text-center"
            >
              <Link href="/about">
                <Button
                  size="lg"
                  className="shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                    border: "none",
                  }}
                >
                  Learn More About DARE
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold mb-4"
              >
                Platform{" "}
                <span style={{ color: THEME.primary }}>Features</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-xl text-gray-600 max-w-3xl mx-auto"
              >
                Powerful tools to track, analyze, and boost business growth for
                women entrepreneurs
              </motion.p>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-8"
            >
              {[
                {
                  icon: <Users />,
                  title: "Profile Management",
                  description:
                    "Comprehensive profile creation for participants, including business details, skills, and development goals",
                  color: THEME.secondary,
                },
                {
                  icon: <BarChart3 />,
                  title: "Business Tracking",
                  description:
                    "Monitor key business metrics monthly: revenue, profit, employees, markets and more",
                  color: THEME.primary,
                },
                {
                  icon: <LineChart />,
                  title: "Growth Analytics",
                  description:
                    "Visualize business trends over time with intuitive charts and data insights",
                  color: THEME.accent,
                },
                {
                  icon: <Trophy />,
                  title: "Mentorship System",
                  description:
                    "Connect with district mentors for guidance, support and business advice",
                  color: THEME.dark,
                },
                {
                  icon: <MapPin />,
                  title: "District Mapping",
                  description:
                    "Organize participants by geographic location across the four DARE districts",
                  color: THEME.secondary,
                },
                {
                  icon: <Upload />,
                  title: "Export Reports",
                  description:
                    "Generate and download detailed reports for stakeholders and analysis",
                  color: THEME.primary,
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={fadeIn}
                  className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
                  onMouseEnter={() => handleFeatureHover(index)}
                  onMouseLeave={() => handleFeatureHover(null)}
                >
                  <div
                    className={`h-2 ${
                      hoveredFeature === index ? "h-3" : "h-2"
                    } transition-all duration-300`}
                    style={{ backgroundColor: feature.color }}
                  ></div>
                  <div className="p-6">
                    <div
                      className="p-3 rounded-full inline-block mb-4"
                      style={{ backgroundColor: feature.color + "20" }}
                    >
                      {React.cloneElement(feature.icon, {
                        style: { color: feature.color },
                        className: "h-6 w-6",
                      })}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="mt-16 text-center"
            >
              <Link href="/features">
                <Button
                  size="lg"
                  className="shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                    border: "none",
                  }}
                >
                  Explore All Features
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Districts Section */}
        <section className="py-20 bg-gray-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 overflow-hidden">
            <div
              className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full"
              style={{ backgroundColor: THEME.primary }}
            ></div>
            <div
              className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full"
              style={{ backgroundColor: THEME.secondary }}
            ></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
            <div className="text-center mb-12">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold mb-4"
              >
                DARE{" "}
                <span style={{ color: THEME.primary }}>Districts</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-xl text-gray-600 max-w-3xl mx-auto"
              >
                Serving young women entrepreneurs across four strategic districts in Ghana
              </motion.p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoadingStats ? (
                // Loading placeholders for districts
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="h-2 bg-gray-200"></div>
                    <div className="p-6">
                      <div className="h-6 w-24 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 w-32 bg-gray-100 rounded mb-4"></div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-gray-200 rounded-full mr-2"></div>
                          <div className="h-4 w-20 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-8 w-20 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Map real district data
                [
                  {
                    name: "Bekwai",
                    region: "Ashanti Region",
                    color: THEME.secondary,
                  },
                  {
                    name: "Gushegu",
                    region: "Northern Region",
                    color: THEME.primary,
                  },
                  {
                    name: "Lower Manya Krobo",
                    region: "Eastern Region",
                    color: THEME.accent,
                  },
                  {
                    name: "Yilo Krobo",
                    region: "Eastern Region",
                    color: THEME.dark,
                  },
                ].map((district, index) => {
                  // Find the participant count for this district
                  const districtParticipantCount = stats?.districtCounts?.[district.name] || 0;
                  
                  return (
                    <motion.div
                      key={district.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                    >
                      <div
                        className="h-2"
                        style={{ backgroundColor: district.color }}
                      ></div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-1">{district.name}</h3>
                        <p className="text-gray-500 text-sm mb-4">
                          {district.region}
                        </p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div
                              className="p-1 rounded-full mr-2"
                              style={{ backgroundColor: district.color + "20" }}
                            >
                              <Users
                                className="h-4 w-4"
                                style={{ color: district.color }}
                              />
                            </div>
                            <span className="text-sm">
                              {districtParticipantCount} participants
                            </span>
                          </div>
                          <Link href={`/districts#${district.name.toLowerCase()}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              style={{ color: district.color }}
                            >
                              Learn more
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="mt-16 text-center"
            >
              <Link href="/districts">
                <Button
                  size="lg"
                  className="shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
                    border: "none",
                  }}
                >
                  Explore All Districts
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Call to Action */}
        <section
          className="py-24 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${THEME.secondary} 0%, ${THEME.primary} 50%, ${THEME.accent} 100%)`,
          }}
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-10 overflow-hidden">
            <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full bg-white"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-white"></div>
          </div>

          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold mb-6 text-white"
            >
              Ready to Join the DARE YIW Program?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-xl text-white opacity-90 mb-8"
            >
              Track your business growth, connect with mentors, and unlock
              success through comprehensive analytics and support
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              {user ? (
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="bg-white hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{ color: THEME.primary }}
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/auth">
                  <Button
                    size="lg"
                    className="bg-white hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{ color: THEME.primary }}
                  >
                    Start Tracking Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer with Mastercard-inspired design */}
      <footer className="bg-gray-900 text-white py-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-8 w-auto">
                  <img src={dareLogo} alt="DARE Logo" className="h-full w-auto" />
                </div>
                <span className="font-bold text-xl">DARE YIW Tracker</span>
              </div>
              <p className="text-gray-400 text-sm">
                Comprehensive tracking platform for the Digital Access and Rural
                Empowerment program in Ghana.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/districts"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Districts
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Districts</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/districts#bekwai"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Bekwai
                  </Link>
                </li>
                <li>
                  <Link
                    href="/districts#gushegu"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Gushegu
                  </Link>
                </li>
                <li>
                  <Link
                    href="/districts#lower-manya"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Lower Manya
                  </Link>
                </li>
                <li>
                  <Link
                    href="/districts#yilo-krobo"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
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
                      <Link
                        href="/dashboard"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/settings"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        Settings
                      </Link>
                    </li>
                  </>
                ) : (
                  <li>
                    <Link
                      href="/auth"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Login / Register
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} DARE YIW Tracker. All rights reserved.</p>
            <p className="mt-2 text-sm">
              Digital Access and Rural Empowerment Program for Young Women in Ghana
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}