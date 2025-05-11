import React from "react";
import { motion } from "framer-motion";
import { BusinessProfile } from "@shared/schema";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Image as ImageIcon,
  Upload,
  FileImage,
  Camera,
  Clock,
  AlertCircle
} from "lucide-react";

// Mastercard color theme
const THEME = {
  primary: "#FF5F00", // Mastercard Orange
  secondary: "#EB001B", // Mastercard Red
  accent: "#F79E1B", // Mastercard Yellow
  dark: "#1A1F71", // Mastercard Dark Blue
};

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

interface BusinessGalleryTabProps {
  business: BusinessProfile;
  id: string;
}

export default function BusinessGalleryTab({ business, id }: BusinessGalleryTabProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <Card className="border-gray-100 shadow-md overflow-hidden">
        <div className="h-1 w-full" style={{ 
          background: `linear-gradient(to right, ${THEME.accent}, ${THEME.primary})` 
        }}></div>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg" style={{ color: THEME.dark }}>
            <div className="h-9 w-9 rounded-full flex items-center justify-center mr-3" style={{ 
              background: `linear-gradient(135deg, ${THEME.accent}20 0%, ${THEME.primary}20 100%)` 
            }}>
              <ImageIcon className="h-5 w-5" style={{ color: THEME.primary }} />
            </div>
            Business Gallery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-24 h-24 mb-6 rounded-full flex items-center justify-center bg-gray-50">
              <Camera className="h-10 w-10 text-gray-300" />
            </div>
            
            <h3 className="text-xl font-medium mb-3" style={{ color: THEME.dark }}>
              Gallery Feature Coming Soon
            </h3>
            
            <p className="text-gray-500 max-w-lg mb-8">
              The business gallery feature is currently under development. Soon, you'll be able to upload and manage photos showcasing this business's products, services, and team.
            </p>
            
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-8 max-w-md flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h4 className="font-medium text-amber-700 mb-1">Development in Progress</h4>
                <p className="text-amber-600 text-sm">
                  We're currently working on the backend infrastructure to support image uploads and management. Check back soon for updates!
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-2xl">
              <div className="rounded-lg border border-dashed border-gray-200 p-6 flex flex-col items-center justify-center bg-gray-50">
                <FileImage className="h-8 w-8 text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm text-center">Product Images</p>
              </div>
              <div className="rounded-lg border border-dashed border-gray-200 p-6 flex flex-col items-center justify-center bg-gray-50">
                <Camera className="h-8 w-8 text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm text-center">Team Photos</p>
              </div>
              <div className="rounded-lg border border-dashed border-gray-200 p-6 flex flex-col items-center justify-center bg-gray-50">
                <Upload className="h-8 w-8 text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm text-center">Workspace</p>
              </div>
            </div>
            
            <div className="mt-10 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-sm text-gray-400">Expected completion: July 2025</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}