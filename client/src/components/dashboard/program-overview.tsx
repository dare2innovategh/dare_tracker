import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
  Info, 
  Book, 
  Users, 
  GraduationCap, 
  MapPin, 
  Target, 
  ArrowRight,
  Briefcase,
  Award,
  PieChart,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

// Animation variant
const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

// Application theme
const THEME = {
  primary: "#0072CE",
  secondary: "#6C17C9",
  accent: "#00B8A9",
  dark: "#172449",
};

export default function ProgramOverview() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
      className="mt-8"
    >
      <div className="flex items-center mb-4">
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center mr-3"
          style={{
            background: `linear-gradient(135deg, ${THEME.primary}20 0%, ${THEME.accent}20 100%)`,
          }}
        >
          <Info
            className="h-4 w-4"
            style={{ color: THEME.primary }}
          />
        </div>
        <h2 className="text-xl font-bold" style={{ color: THEME.dark }}>
          DARE Program Overview
        </h2>
      </div>

      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Program Description Card */}
        <motion.div variants={cardVariant}>
          <Card className="h-full p-5 shadow-md border-none hover:shadow-lg transition-shadow duration-300">
            <div className="relative">
              <div
                className="absolute -top-5 left-0 right-0 h-1 rounded-t-full"
                style={{
                  background: `linear-gradient(to right, ${THEME.primary}, ${THEME.secondary})`,
                }}
              ></div>
              <div className="flex flex-col h-full">
                <div className="p-2.5 rounded-full w-fit mb-3" style={{ 
                  background: `linear-gradient(135deg, ${THEME.primary}20 0%, ${THEME.primary}10 100%)` 
                }}>
                  <Book className="h-5 w-5" style={{ color: THEME.primary }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: THEME.dark }}>
                  About DARE
                </h3>
                <p className="text-sm text-gray-600 mb-3 flex-grow">
                  Digital Access for Rural Empowerment initiative aims to empower youth in rural districts through 
                  digital literacy and entrepreneurship training.
                </p>
                <div className="mt-auto">
                  <Link href="/about">
                    <Button variant="ghost" size="sm" className="text-[#0072CE] hover:text-[#0058a2] p-0 gap-1 hover:bg-transparent">
                      Learn more
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ERDE Training Program Card */}
        <motion.div variants={cardVariant}>
          <Card className="h-full p-5 shadow-md border-none hover:shadow-lg transition-shadow duration-300">
            <div className="relative">
              <div
                className="absolute -top-5 left-0 right-0 h-1 rounded-t-full"
                style={{
                  background: `linear-gradient(to right, ${THEME.secondary}, ${THEME.accent})`,
                }}
              ></div>
              <div className="flex flex-col h-full">
                <div className="p-2.5 rounded-full w-fit mb-3" style={{ 
                  background: `linear-gradient(135deg, ${THEME.secondary}20 0%, ${THEME.secondary}10 100%)` 
                }}>
                  <GraduationCap className="h-5 w-5" style={{ color: THEME.secondary }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: THEME.dark }}>
                  ERDE Program
                </h3>
                <p className="text-sm text-gray-600 mb-3 flex-grow">
                  Empower Rural Digital Entrepreneur equips youth with digital skills and entrepreneurship 
                  knowledge through comprehensive training modules.
                </p>
                <div className="mt-auto">
                  <Link href="/training-programs">
                    <Button variant="ghost" size="sm" className="text-[#6C17C9] hover:text-[#5212a2] p-0 gap-1 hover:bg-transparent">
                      View modules
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Business Development Card */}
        <motion.div variants={cardVariant}>
          <Card className="h-full p-5 shadow-md border-none hover:shadow-lg transition-shadow duration-300">
            <div className="relative">
              <div
                className="absolute -top-5 left-0 right-0 h-1 rounded-t-full"
                style={{
                  background: `linear-gradient(to right, #EB001B, #F79E1B)`,
                }}
              ></div>
              <div className="flex flex-col h-full">
                <div className="p-2.5 rounded-full w-fit mb-3" style={{ 
                  background: `linear-gradient(135deg, #EB001B20 0%, #F79E1B10 100%)` 
                }}>
                  <Briefcase className="h-5 w-5" style={{ color: "#EB001B" }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: THEME.dark }}>
                  Business Support
                </h3>
                <p className="text-sm text-gray-600 mb-3 flex-grow">
                  DARE provides comprehensive business development support including mentoring, 
                  tracking growth metrics, and connecting entrepreneurs with market opportunities.
                </p>
                <div className="mt-auto">
                  <Link href="/businesses">
                    <Button variant="ghost" size="sm" className="text-[#EB001B] hover:text-[#c0001b] p-0 gap-1 hover:bg-transparent">
                      View businesses
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Rural Districts Card */}
        <motion.div variants={cardVariant}>
          <Card className="h-full p-5 shadow-md border-none hover:shadow-lg transition-shadow duration-300">
            <div className="relative">
              <div
                className="absolute -top-5 left-0 right-0 h-1 rounded-t-full"
                style={{
                  background: `linear-gradient(to right, ${THEME.accent}, ${THEME.dark})`,
                }}
              ></div>
              <div className="flex flex-col h-full">
                <div className="p-2.5 rounded-full w-fit mb-3" style={{ 
                  background: `linear-gradient(135deg, ${THEME.accent}20 0%, ${THEME.dark}10 100%)` 
                }}>
                  <Building className="h-5 w-5" style={{ color: THEME.accent }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: THEME.dark }}>
                  Rural Districts
                </h3>
                <p className="text-sm text-gray-600 mb-2 flex-grow">
                  DARE operates in 4 rural districts across Ghana, focusing on creating sustainable 
                  economic opportunities for young people in these communities.
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700">Bekwai</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700">Gushegu</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700">Lower Manya Krobo</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700">Yilo Krobo</span>
                </div>
                <div className="mt-auto">
                  <Link href="/districts">
                    <Button variant="ghost" size="sm" className="text-[#00B8A9] hover:text-[#00867c] p-0 gap-1 hover:bg-transparent">
                      View districts
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}