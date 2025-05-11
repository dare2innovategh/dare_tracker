import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, LoaderCircle, UserCheck } from "lucide-react";

// DARE logo and background image
import dareLogo from "@assets/dare-logo.png";
const districtHeroImage = "/img/districts-hero.jpg";

// Define login schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Form submission handler
  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Left side - Auth form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 lg:p-12 overflow-y-auto bg-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-10 text-center">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-8 flex justify-center"
            >
              <div className="flex items-center justify-center">
                <img 
                  src={dareLogo} 
                  alt="DARE Logo" 
                  className="h-20 md:h-24 w-auto" 
                />
              </div>
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              DARE Youth-in-Jobs Tracker
            </h1>
            <p className="text-md text-gray-600">
              Sign in to access your account
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full"
          >
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center mb-2">
                  <UserCheck className="w-5 h-5 mr-2 text-orange-500" />
                  <CardTitle className="text-xl font-semibold">Sign In</CardTitle>
                </div>
                <CardDescription>Enter your credentials to access your account</CardDescription>
              </CardHeader>
              
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your username" 
                              className="h-11" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Enter your password" 
                                className="h-11 pr-10" 
                                {...field} 
                              />
                            </FormControl>
                            <button 
                              type="button"
                              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                              onClick={togglePasswordVisibility}
                              tabIndex={-1}
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-11 mt-6 bg-gradient-to-r from-[#ED3122] to-[#F39D11] hover:from-[#F39D11] hover:to-[#ED3122] transition-all duration-300"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Right side - Background with text overlay */}
      <div className="hidden md:block md:w-1/2 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center z-0" 
          style={{ backgroundImage: `url(${districtHeroImage})` }}
        ></div>
        
        {/* Add a darker overlay to improve text visibility */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        
        <div className="absolute inset-0 flex flex-col justify-end items-center p-12 z-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="max-w-md mx-auto text-center text-white mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-white/80 text-transparent bg-clip-text tracking-tight" style={{ fontFamily: "'FF Mark', Arial, sans-serif" }}>
              DARE Intervention 2
            </h2>
            
            <p className="mb-6 text-white/90 text-2xl md:text-3xl font-medium leading-relaxed">
              Transforming youth skills into sustainable businesses
            </p>
            
            <div className="text-white/80 text-base">
              <p>A project by Digital Access and Rural Empowerment (DARE)</p>
              <p className="mt-2">Supported by Mastercard Foundation</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
