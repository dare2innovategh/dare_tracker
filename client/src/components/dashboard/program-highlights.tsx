import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
  ChevronRight, 
  LucideIcon, 
  Lightbulb, 
  Smartphone, 
  Globe, 
  Facebook, 
  Instagram, 
  DollarSign, 
  Wallet, 
  Shield,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

// Application theme
const THEME = {
  primary: "#0072CE",
  secondary: "#6C17C9",
  accent: "#00B8A9",
  dark: "#172449",
};

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

// ERDE Training modules data
const trainingModules = [
  {
    id: 'digital-devices',
    title: 'Introduction to Digital Devices',
    icon: Smartphone,
    color: THEME.primary,
    description: 'Learn about different types of digital devices including smartphones, tablets, laptops, and how to use them effectively.',
    skills: ['Device operation', 'Basic troubleshooting', 'Connectivity setup'],
    progress: 100,
  },
  {
    id: 'internet',
    title: 'The Internet and Mobile Applications',
    icon: Globe,
    color: THEME.secondary,
    description: 'Discover how to navigate the internet, use mobile applications, and access online resources and services.',
    skills: ['Web browsing', 'Email communication', 'App installation and use'],
    progress: 100,
  },
  {
    id: 'social-media-intro',
    title: 'Introduction to Social Media',
    icon: Facebook,
    color: '#4267B2',
    description: 'Learn about various social media platforms and how they can be used for personal and professional networking.',
    skills: ['Account creation', 'Content sharing', 'Privacy settings'],
    progress: 100,
  },
  {
    id: 'social-media-business',
    title: 'Using Social Media for Business',
    icon: Instagram,
    color: '#E1306C',
    description: 'Explore techniques to leverage social media platforms for business marketing, customer engagement, and brand building.',
    skills: ['Business page setup', 'Content strategy', 'Audience engagement'],
    progress: 85,
  },
  {
    id: 'financial-management',
    title: 'Digital Financial Management',
    icon: DollarSign,
    color: '#00A17A',
    description: 'Learn digital tools and techniques for managing finances, tracking expenses, and planning budgets for your business.',
    skills: ['Financial record keeping', 'Budget planning', 'Expense tracking'],
    progress: 75,
  },
  {
    id: 'mobile-money',
    title: 'Using Mobile Money in Business',
    icon: Wallet,
    color: '#EB001B',
    description: 'Master mobile money services for business transactions, customer payments, and financial operations.',
    skills: ['Mobile money setup', 'Transaction processing', 'Financial records'],
    progress: 60,
  },
  {
    id: 'digital-security',
    title: 'Digital Safety and Security',
    icon: Shield,
    color: '#FFC72C',
    description: 'Understand digital security principles to protect your personal information and business data online.',
    skills: ['Password management', 'Secure browsing', 'Scam identification'],
    progress: 50,
  },
];

interface ModuleCardProps {
  module: {
    id: string;
    title: string;
    icon: LucideIcon;
    color: string;
    description: string;
    skills: string[];
    progress: number;
  };
}

const ModuleCard: React.FC<ModuleCardProps> = ({ module }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = module.icon;

  return (
    <Card 
      className={`p-4 mb-3 shadow-sm border-none transition-all duration-300 ${isExpanded ? 'shadow-md' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-full" 
              style={{ background: `${module.color}15` }}
            >
              <Icon className="h-5 w-5" style={{ color: module.color }} />
            </div>
            <h3 className="font-medium text-gray-900">{module.title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 w-32">
              <Progress value={module.progress} className="h-2" />
              <span className="text-xs text-gray-500">{module.progress}%</span>
            </div>
            <ChevronRight 
              className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} 
            />
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4 pl-10">
            <p className="text-sm text-gray-600 mb-3">{module.description}</p>
            <div className="mb-3">
              <h4 className="text-xs font-medium uppercase text-gray-500 mb-2">Key Skills</h4>
              <div className="flex flex-wrap gap-2">
                {module.skills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default function ProgramHighlights() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="mt-8"
    >
      <div className="flex items-center mb-4">
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center mr-3"
          style={{
            background: `linear-gradient(135deg, ${THEME.primary}20 0%, ${THEME.secondary}20 100%)`,
          }}
        >
          <Lightbulb
            className="h-4 w-4"
            style={{ color: THEME.secondary }}
          />
        </div>
        <h2 className="text-xl font-bold" style={{ color: THEME.dark }}>
          Training Program Highlights
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <Tabs defaultValue="training" className="w-full">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto">
              <TabsTrigger value="training" className="py-2.5">ERDE Training Modules</TabsTrigger>
              <TabsTrigger value="progress" className="py-2.5">Program Progress</TabsTrigger>
              <TabsTrigger value="upcoming" className="py-2.5">Upcoming Workshops</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="training" className="p-4">
            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
              {trainingModules.map((module) => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" className="text-[#0072CE] hover:text-[#0058a2] gap-1">
                View all training modules
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="progress" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3" style={{ color: THEME.dark }}>Overall Program Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Youth Enrollment</span>
                      <span className="text-sm text-gray-500">57/100</span>
                    </div>
                    <Progress value={57} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">ERDE Training Completion</span>
                      <span className="text-sm text-gray-500">75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Business Formation</span>
                      <span className="text-sm text-gray-500">35%</span>
                    </div>
                    <Progress value={35} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Digital Integration</span>
                      <span className="text-sm text-gray-500">62%</span>
                    </div>
                    <Progress value={62} className="h-2" />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3" style={{ color: THEME.dark }}>District Performance</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Bekwai</span>
                      <span className="text-sm text-gray-500">68%</span>
                    </div>
                    <Progress value={68} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Gushegu</span>
                      <span className="text-sm text-gray-500">72%</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Lower Manya Krobo</span>
                      <span className="text-sm text-gray-500">81%</span>
                    </div>
                    <Progress value={81} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Yilo Krobo</span>
                      <span className="text-sm text-gray-500">64%</span>
                    </div>
                    <Progress value={64} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="upcoming" className="p-4">
            <div className="space-y-4">
              <Card className="p-4 shadow-sm border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="min-w-[60px] h-14 flex flex-col items-center justify-center bg-primary/10 rounded-md text-primary">
                    <span className="text-lg font-bold">28</span>
                    <span className="text-xs">Apr</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Social Media Marketing Workshop</h3>
                    <p className="text-sm text-gray-500 mb-2">2:00 PM - 5:00 PM • Virtual Session</p>
                    <p className="text-sm text-gray-600">Learn advanced strategies for marketing your business through Facebook, Instagram, and TikTok.</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 shadow-sm border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="min-w-[60px] h-14 flex flex-col items-center justify-center bg-secondary/10 rounded-md text-secondary">
                    <span className="text-lg font-bold">05</span>
                    <span className="text-xs">May</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Digital Financial Services Training</h3>
                    <p className="text-sm text-gray-500 mb-2">10:00 AM - 1:00 PM • Bekwai Community Center</p>
                    <p className="text-sm text-gray-600">Hands-on training session on mobile banking, mobile money, and digital payment solutions for small businesses.</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 shadow-sm border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="min-w-[60px] h-14 flex flex-col items-center justify-center bg-accent/10 rounded-md text-accent">
                    <span className="text-lg font-bold">12</span>
                    <span className="text-xs">May</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Business Growth Mentor Session</h3>
                    <p className="text-sm text-gray-500 mb-2">2:00 PM - 4:30 PM • Yilo Krobo District Office</p>
                    <p className="text-sm text-gray-600">One-on-one mentoring sessions with experienced business advisors to help scale your digital business presence.</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}