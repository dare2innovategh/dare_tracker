import { useState, useEffect } from "react";
import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { 
  Users, 
  Menu, 
  X, 
  MapPin,
  Map,
  Building,
  Users2,
  Tractor,
  ShoppingBag,
  GraduationCap,
  Landmark,
  Gem,
  ChevronDown,
  ArrowRight,
  ChevronRight,
  Star
} from "lucide-react";
// Use actual DARE assets
const dareLogo = "/img/dare-logo.png";
const districtsHero = "/img/districts-hero.jpg";

// Mastercard color theme - matching the other pages
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

interface BusinessFocusLevels {
  "Primary Focus": { icon: React.ReactNode; color: string };
  "Secondary Focus": { icon: React.ReactNode; color: string };
  "Moderate Focus": { icon: React.ReactNode; color: string };
  "Limited Focus": { icon: React.ReactNode; color: string };
  [key: string]: { icon: React.ReactNode; color: string };
}

export default function DistrictsPage() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeDistrict, setActiveDistrict] = useState<number | null>(null);
  const [expandedDistrict, setExpandedDistrict] = useState<number | null>(null);

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

  const handleDistrictHover = (index: number | null) => {
    setActiveDistrict(index);
  };

  const toggleDistrictExpand = (index: number | null) => {
    setExpandedDistrict(expandedDistrict === index ? null : index);
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

  const scaleIn = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 10 }
    }
  };

  const districts = [
    {
      name: "Bekwai",
      region: "Ashanti Region",
      population: "Approx. 140,000",
      mainActivities: "Cocoa farming, agriculture, small-scale mining",
      dareFocus: "Agricultural business development and value chain enhancement",
      participantCount: 72,
      description: "Bekwai Municipal District is located in the southern part of the Ashanti Region and is known for its rich cocoa production. The area has a well-established agricultural sector, with potential for value addition and processing. The DARE program in Bekwai focuses on helping young women develop agribusinesses that take advantage of the abundant agricultural resources in the area.",
      successStories: [
        "Cocoa processing cooperative with 15 members achieving 40% revenue growth in the past year",
        "Agricultural input supply business expanding to three additional communities"
      ],
      challengesAddressed: "Limited access to agricultural technology, transportation challenges for rural producers, and market access barriers",
      color: THEME.secondary,
      primaryBusinessFocus: "Agriculture",
      coordinates: { x: 40, y: 60 }
    },
    {
      name: "Gushegu",
      region: "Northern Region",
      population: "Approx. 120,000",
      mainActivities: "Agriculture, crafts production, trading",
      dareFocus: "Craft production businesses and agricultural services",
      participantCount: 68,
      description: "Gushegu is a district in the Northern Region, characterized by its vibrant cultural heritage and traditional craft production. The area faces challenges including seasonal drought and limited access to markets. The DARE program in Gushegu emphasizes developing sustainable craft businesses that leverage traditional skills while introducing modern design and marketing approaches.",
      successStories: [
        "Women's cooperative producing handcrafted textiles now exporting to neighboring countries",
        "Digital marketplace connecting local artisans to urban markets, increasing sales by 60%"
      ],
      challengesAddressed: "Seasonal fluctuations in income, limited access to electricity for production, and digital connectivity challenges",
      color: THEME.primary,
      primaryBusinessFocus: "Crafts & Manufacturing",
      coordinates: { x: 30, y: 30 }
    },
    {
      name: "Lower Manya Krobo",
      region: "Eastern Region",
      population: "Approx. 90,000",
      mainActivities: "Fishing, trading, services",
      dareFocus: "Retail and market-based businesses",
      participantCount: 53,
      description: "Lower Manya Krobo District is located in the Eastern Region. The district is positioned along the Volta River and has a diverse economy including fishing, trading, and service-based businesses. The DARE program in Lower Manya focuses on retail and market-based businesses, helping young women establish sustainable trading operations and service-oriented enterprises.",
      successStories: [
        "Community cold storage facility run by women entrepreneurs, reducing post-harvest losses",
        "Mobile-based retail network connecting rural vendors to wholesale suppliers"
      ],
      challengesAddressed: "Market access limitations, supply chain inefficiencies, and lack of appropriate storage facilities",
      color: THEME.accent,
      primaryBusinessFocus: "Retail & Trading",
      coordinates: { x: 75, y: 50 }
    },
    {
      name: "Yilo Krobo",
      region: "Eastern Region",
      population: "Approx. 110,000",
      mainActivities: "Beadmaking, pottery, agriculture, services",
      dareFocus: "Cultural crafts and tourism opportunities",
      participantCount: 64,
      description: "Yilo Krobo District is renowned for its rich cultural heritage, particularly in beadmaking and traditional crafts. The district is located in the Eastern Region and has significant potential for cultural tourism development. The DARE program in Yilo Krobo focuses on helping young women develop businesses that leverage the district's cultural assets and craft traditions while connecting to broader tourism opportunities.",
      successStories: [
        "Women-led bead craft cooperative now supplying major fashion outlets in Accra",
        "Cultural tourism initiative combining craft demonstrations with homestay experiences"
      ],
      challengesAddressed: "Preserving traditional knowledge while innovating, accessing tourism markets, and developing quality control standards",
      color: THEME.dark,
      primaryBusinessFocus: "Crafts & Manufacturing",
      coordinates: { x: 65, y: 45 }
    }
  ];

  const businessFocusLevels: BusinessFocusLevels = {
    "Primary Focus": { icon: <Star className="h-4 w-4" />, color: "text-white" },
    "Secondary Focus": { icon: null, color: "text-gray-700" },
    "Moderate Focus": { icon: null, color: "text-gray-500" },
    "Limited Focus": { icon: null, color: "text-gray-400" }
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
            <div className="h-12 w-auto">
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
            <Link href="/features" className="font-medium hover:text-primary transition-colors relative group">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#EB001B] to-[#F79E1B] group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/districts" className="font-medium transition-colors relative">
              <span style={{ color: THEME.primary }}>Districts</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#EB001B] to-[#F79E1B]"></span>
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
            <Link href="/features" className="py-3 block font-medium hover:text-primary transition-colors">
              Features
            </Link>
          </motion.div>
          <motion.div variants={fadeIn}>
            <Link href="/districts" className="py-3 block font-medium transition-colors">
              <span style={{ color: THEME.primary }}>Districts</span>
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
        {/* Hero Section with districts hero image */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          {/* Hero Background Image */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30 z-10"></div>
            <img 
              src={districtsHero} 
              alt="DARE District Program" 
              className="w-full h-full object-cover object-center"
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-20">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="text-center"
            >
              <h1 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                Program <span style={{ color: THEME.accent }}>Districts</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                The DARE program operates in four key districts, each with unique characteristics and business opportunities
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
                  const element = document.getElementById('map-overview');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <p className="text-sm text-white mb-2">Explore districts</p>
                <ChevronDown className="text-white" />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Districts overview section */}
        <section id="map-overview" className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-4xl font-bold mb-4">DARE Districts Map</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Explore the program's focus areas across diverse regions
              </p>
            </motion.div>

            {/* Regional Map with District Markers */}
            <motion.div 
              className="relative w-full max-w-3xl mx-auto aspect-square md:aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-lg mb-10"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
            >
              <div className="absolute inset-0 p-4 md:p-8">
                {/* Abstract geographical representation */}
                <div className="w-full h-full relative rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-green-50 border border-gray-200">
                  <div className="absolute inset-0 opacity-20">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <path fill={THEME.dark} d="M54.2,-65.2C68.8,-55.2,78.3,-37.3,83.1,-18.2C88,0.9,88.2,21.2,78.9,34.6C69.6,48,50.7,54.5,33.1,62.4C15.5,70.3,-0.8,79.5,-19.1,79.1C-37.4,78.6,-57.8,68.5,-65.8,53C-73.8,37.4,-69.5,16.3,-64.1,-1.3C-58.7,-18.9,-52.3,-33,-42.1,-43.4C-31.9,-53.8,-17.9,-60.4,0.8,-61.4C19.6,-62.5,39.5,-58,54.2,-65.2Z" transform="translate(100 100)" />
                    </svg>
                  </div>
                  
                  {/* District Markers */}
                  {districts.map((district, idx) => (
                    <motion.div 
                      key={idx}
                      className="absolute"
                      style={{ 
                        left: `${district.coordinates.x}%`, 
                        top: `${district.coordinates.y}%` 
                      }}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.2 }}
                      whileHover={{ scale: 1.2 }}
                    >
                      <div 
                        className="w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center cursor-pointer relative"
                        style={{ 
                          backgroundColor: district.color,
                          boxShadow: `0 0 0 4px ${district.color}30`
                        }}
                        onClick={() => toggleDistrictExpand(idx)}
                      >
                        <MapPin className="h-3 w-3 text-white" />
                        
                        {/* District name tooltip */}
                        <motion.div 
                          className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-md whitespace-nowrap z-40"
                          initial={{ opacity: 0, y: 10 }}
                          whileHover={{ opacity: 1, y: 0 }}
                        >
                          {district.name}
                        </motion.div>
                      </div>
                      
                      {/* Expanded district info */}
                      {expandedDistrict === idx && (
                        <motion.div 
                          className="absolute top-8 left-0 bg-white rounded-xl shadow-xl p-4 z-50 w-64 -ml-32"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{ borderTop: `3px solid ${district.color}` }}
                        >
                          <h3 className="font-bold text-lg mb-1">{district.name}</h3>
                          <p className="text-gray-500 text-sm mb-2">{district.region}</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span>{district.population}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4 text-gray-400" />
                              <span>{district.participantCount} Participants</span>
                            </div>
                            <div className="pt-2 border-t border-gray-100 mt-2">
                              <span className="text-gray-700 font-medium">Primary Focus:</span>
                              <p className="text-gray-600">{district.primaryBusinessFocus}</p>
                            </div>
                          </div>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="mt-2 p-0 h-auto flex items-center text-sm font-medium w-full justify-end"
                            style={{ color: district.color }}
                            onClick={() => {
                              // Scroll to the district section using smooth scrolling
                              const element = document.getElementById(`district-${idx}`);
                              if (element) {
                                // Add some offset to account for fixed header
                                const yOffset = -100; 
                                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                window.scrollTo({top: y, behavior: 'smooth'});
                              }
                            }}
                          >
                            View Details
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* District Detailed Profiles */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-4xl font-bold mb-4">District Profiles</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Detailed information about each program district and its unique characteristics
              </p>
            </motion.div>

            <div className="space-y-16">
              {districts.map((district, idx) => (
                <motion.div
                  key={idx}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1 }
                  }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden"
                >
                  <div className="h-2" style={{ backgroundColor: district.color }}></div>
                  <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                      <div>
                        <h3 id={`district-${idx}`} className="text-2xl font-bold mb-1">{district.name}</h3>
                        <p className="text-gray-500">{district.region}</p>
                      </div>
                      <div className="mt-4 md:mt-0 flex items-center">
                        <div className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: `${district.color}20`, color: district.color }}>
                          {district.primaryBusinessFocus}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-8">
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-lg mb-4">District Overview</h4>
                        <p className="text-gray-600 mb-6">{district.description}</p>
                        
                        <div className="space-y-6">
                          <div>
                            <h5 className="font-medium mb-3">DARE Program Focus</h5>
                            <p className="text-gray-600">{district.dareFocus}</p>
                          </div>
                          
                          <div>
                            <h5 className="font-medium mb-3">Main Economic Activities</h5>
                            <p className="text-gray-600">{district.mainActivities}</p>
                          </div>
                          
                          <div>
                            <h5 className="font-medium mb-3">Challenges Addressed</h5>
                            <p className="text-gray-600">{district.challengesAddressed}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="bg-gray-50 rounded-xl p-5">
                          <h4 className="font-medium mb-4">District Demographics</h4>
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Population:</span>
                              <span className="font-medium">{district.population}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">DARE Participants:</span>
                              <span className="font-medium">{district.participantCount}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-3">Success Stories</h4>
                          <ul className="space-y-2">
                            {district.successStories.map((story, storyIdx) => (
                              <li key={storyIdx} className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: district.color }}></div>
                                <span className="text-sm text-gray-600">{story}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: THEME.dark }}>Explore the DARE Program</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
                Ready to learn more about our program activities across different districts or access your district dashboard?
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
                    Learn About DARE
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
                Comprehensive tracking platform for the Digital Access and Rural Empowerment program.
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
                {districts.map((district, idx) => (
                  <li key={idx}>
                    <Link href={`/districts#district-${idx}`} className="text-gray-400 hover:text-white transition-colors">
                      {district.name.split(',')[0]}
                    </Link>
                  </li>
                ))}
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
              Digital Access and Rural Empowerment Program for Young Women
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}