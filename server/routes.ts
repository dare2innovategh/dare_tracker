import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { z } from "zod";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { requirePermission } from "./middleware/permissions";
import { insertMentorshipMessageSchema, insertMentorSchema } from "@shared/schema";
import businessProfilesRouter from "./routes/business-profiles-updated";
import seedBusinessesRouter from "./routes/seed-businesses";
import mentorBusinessRouter from "./routes/mentor-businesses";
import uploadRouter from './routes/upload';
import businessAdviceRouter from "./routes/business-advice";
import serviceCategoriesRouter from "./routes/service-categories";
import serviceSubcategoriesRouter from "./routes/service-subcategories";
import skillsRouter from "./routes/skills";
import trainingProgramsRouter from "./routes/training-programs";
import diagnosticsRouter from "./routes/diagnostics";
import adminActionsRouter from "./routes/admin-actions";
import portfolioRouter from "./routes/portfolio";
import businessTrackingRouter from "./routes/business-tracking";
import makerspacesRouter from "./routes/makerspaces";
import makerspaceResourcesRouter from "./routes/makerspace-resources-fixed";
console.log("Registered routes for makerspace resources (fixed version)");
import { executeCreateMentorAccounts } from "./create-mentors";
import { getUserPermissions } from "./routes/permissions";
import permissionsManagementRouter from "./routes/permissions-management";
import adminPermissionsRouter from "./routes/admin-permissions";
import rolePermissionsRouter from "./routes/role-permissions";
import { getAllRoles, createRole, updateRole, deleteRole, getRoleById } from "./routes/roles";
import youthManagementRouter from "./routes/youth-management";
import trainingProgramsNestedRouter from "./routes/training/programs";
import { youthBusinessRouter } from "./routes/youth-businesses";
import feasibilityRouter from "./routes/feasibility";
import businessManagementRouter from "./routes/business-management";
import businessResourcesRouter from "./routes/business-resources";
import reportsRouter from "./routes/reports";

// Add hashPassword function
async function hashPassword(password: string): Promise<string> {
  const scryptAsync = promisify(scrypt);
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Register all routers
  
  app.use("/api/business-profiles", businessProfilesRouter);
  app.use("/api/seed-businesses", seedBusinessesRouter);
  app.use("/api/mentor-businesses", mentorBusinessRouter);
  app.use('/api/upload', uploadRouter);
  app.use("/api/business-advice", businessAdviceRouter);
  app.use("/api/service-categories", serviceCategoriesRouter);
  app.use("/api/service-subcategories", serviceSubcategoriesRouter);
  app.use("/api/skills", skillsRouter);
  app.use("/api/training-programs", trainingProgramsRouter);
  app.use("/api/training/programs", trainingProgramsRouter); // Add duplicate route for compatibility
  
  // Register the youth management module with all youth-related routes
  app.use("/api/youth", youthManagementRouter);
  
  // Redirect old endpoint requests to new structure
  app.get("/api/youth-profiles", (req, res) => {
    console.log("Redirecting from old youth-profiles endpoint to new structure");
    res.redirect(307, "/api/youth/profiles");
  });
  
  // Redirect old endpoint requests to new structure with ID
  app.get("/api/youth-profiles/:id", (req, res) => {
    console.log(`Redirecting from old youth-profiles endpoint for ID: ${req.params.id} to new structure`);
    res.redirect(307, `/api/youth/profiles/${req.params.id}`);
  });
  
  // Redirect DELETE requests for old endpoint to new structure
  app.delete("/api/youth-profiles/:id", (req, res) => {
    console.log(`Redirecting DELETE from old youth-profiles endpoint for ID: ${req.params.id} to new structure`);
    res.redirect(307, `/api/youth/profiles/${req.params.id}`);
  });
  
  app.use("/api/diagnostics", diagnosticsRouter);
  app.use("/api/admin", adminActionsRouter);
  app.use("/api", portfolioRouter);
  app.use("/api/business-tracking", businessTrackingRouter);
  app.use("/api/makerspaces", makerspacesRouter);
  app.use("/api/makerspace-resources", makerspaceResourcesRouter);
  app.use("/api/admin/permissions", permissionsManagementRouter);
  app.use("/api/admin/permissions-control", adminPermissionsRouter);
  app.use("/api/role-permissions", rolePermissionsRouter);
  app.use("/api/training/programs", trainingProgramsNestedRouter);
  app.use("/api/feasibility", feasibilityRouter);
  app.use("/api/business-management", businessManagementRouter);
  app.use("/api/business-resources", businessResourcesRouter);
  app.use("/api/reports", reportsRouter);
  
  // Create mentors from file
  app.post("/api/admin/create-mentors", requirePermission("mentors", "create"), async (req, res) => {
    try {
      // First check if mentors already exist
      try {
        const mentorResults = await db.select({ count: sql`COUNT(*)` }).from(sql`mentors`);
        const count = parseInt(String(mentorResults[0]?.count || 0));
        
        if (count > 0) {
          return res.status(200).json({ 
            success: true, 
            message: "Mentors already exist in the database. No new mentors created.",
            existingCount: count
          });
        }
      } catch (error) {
        console.error("Error checking existing mentors:", error);
        // Continue to create mentors - this might be a first run where table doesn't exist yet
      }
      
      // Proceed with creating mentors if none exist
      const result = await executeCreateMentorAccounts();
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error creating mentor accounts:", error);
      return res.status(500).json({ error: "Failed to create mentor accounts" });
    }
  });
  // Register Youth-Business routes
  app.use("/api", youthBusinessRouter);
  
  // Custom Roles Management API
  app.get("/api/roles", getAllRoles);
  app.post("/api/roles", createRole);
  app.get("/api/roles/:id", getRoleById);
  app.put("/api/roles/:id", updateRole);
  app.delete("/api/roles/:id", deleteRole);
  
  // Role Permissions Management API - Using the Express Router
  app.use("/api/role-permissions", rolePermissionsRouter);
  app.use("/api/resources-actions", rolePermissionsRouter);
  
  // User permissions endpoint
  app.get("/api/permissions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userRole = req.user?.role;
      
      // Admin has all permissions by default
      if (userRole === "admin") {
        // Return all possible permissions
        const permissions = [];
        const resources = [
          'users', 'roles', 'permissions', 'youth_profiles', 'youth_education', 
          'youth_certifications', 'youth_skills', 'businesses', 'business_youth', 
          'mentors', 'mentor_assignments', 'mentorship_messages', 'business_advice', 
          'reports', 'system_settings'
        ];
        const actions = ['view', 'create', 'edit', 'delete', 'manage'];
        
        for (const resource of resources) {
          for (const action of actions) {
            permissions.push({ resource, action });
          }
        }
        
        return res.json(permissions);
      }
      
      // For other roles, fetch permissions from database
      if (userRole) {
        const permissions = await storage.getRolePermissionsByRole(userRole);
        const formattedPermissions = permissions.map(p => ({
          resource: p.resource,
          action: p.action
        }));
        
        return res.json(formattedPermissions);
      }
      
      // Default empty permissions if no role
      return res.json([]);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      return res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });
  
  // User Management API
  // Get users - relaxed permissions for dropdown lists in forms (like mentor creation)  
  app.get("/api/users", async (req, res, next) => {
    try {
      // Must be authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Admins get full access with pagination
      if (req.user?.role === "admin") {
        console.log("Admin user fetching users with pagination");
        // Get pagination parameters from query string
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        
        // Get paginated users
        const result = await storage.getAllUsers(page, limit);
        
        // Filter out sensitive information
        const sanitizedUsers = result.users.map((user) => ({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          district: user.district,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt
        }));
        
        // Return paginated result with metadata
        return res.status(200).json({
          users: sanitizedUsers,
          pagination: {
            total: result.total,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit)
          }
        });
      } 
      // Non-admins get a simplified list (for dropdowns in forms)
      else {
        console.log("Non-admin user fetching simplified user list");
        // For non-admin users (for select dropdowns, etc.)
        // Return a simplified list of users without pagination
        const result = await storage.getAllUsers(1, 1000); // Get first 1000 users
        
        // Return a simplified list with minimal information
        const simplifiedUsers = result.users.map((user) => ({
          id: user.id,
          username: user.username,
          fullName: user.fullName || user.username,
          email: user.email,
          role: user.role
        }));
        
        return res.status(200).json(simplifiedUsers);
      }
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/users/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Only administrators can access user management" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Filter out sensitive information
      const sanitizedUser = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        district: user.district,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      };
      
      res.status(200).json(sanitizedUser);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new user
  app.post("/api/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Only administrators can create users" });
      }
      
      const { username, password, fullName, role, email, district, profilePicture } = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(password);
      
      // Create the user
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        fullName,
        role: role || "user",
        email: email || null,
        district: district || null,
        profilePicture: profilePicture || null
      });
      
      // Filter out sensitive information
      const sanitizedUser = {
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        district: newUser.district,
        profilePicture: newUser.profilePicture,
        createdAt: newUser.createdAt
      };
      
      res.status(201).json(sanitizedUser);
    } catch (error) {
      if (error instanceof Error) {
        console.error("User creation error:", error.message);
        return res.status(500).json({ message: "Failed to create user", error: error.message });
      }
      next(error);
    }
  });
  
  // Update an existing user
  app.patch("/api/users/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to update a user profile" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if user is updating their own profile or is an admin
      const isOwnProfile = req.user?.id === id;
      const isAdmin = req.user?.role === "admin";
      
      if (!isOwnProfile && !isAdmin) {
        return res.status(403).json({ message: "You can only update your own profile unless you're an administrator" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Extract request body
      const { username, password, fullName, role, email, district, profilePicture, lastLogin } = req.body;
      
      // Prepare update data with different logic for admin vs regular user
      const updateData: any = {};
      
      // Username can only be changed by admins and needs to be validated
      if (username && username !== user.username) {
        if (!isAdmin) {
          return res.status(403).json({ message: "Only administrators can change usernames" });
        }
        
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already exists" });
        }
        
        updateData.username = username;
      }
      
      // Role can only be changed by admins
      if (role && role !== user.role) {
        if (!isAdmin) {
          return res.status(403).json({ message: "Only administrators can change roles" });
        }
        updateData.role = role;
      }
      
      // Password change requires current password verification for non-admins (TBD)
      if (password) {
        updateData.password = await hashPassword(password);
      }
      
      // Regular user fields that can be updated by the user themselves
      if (fullName) updateData.fullName = fullName;
      if (email !== undefined) updateData.email = email;
      if (district !== undefined) updateData.district = district;
      if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
      
      // Only admins can directly set lastLogin
      if (lastLogin && isAdmin) {
        updateData.lastLogin = new Date(lastLogin);
      }
      
      // Log the update for auditing
      console.log(`Updating user ${id} with data:`, updateData);
      
      // Update the user
      const updatedUser = await storage.updateUser(id, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found after update" });
      }
      
      console.log(`Update successful for user ${id}:`, updatedUser);
      
      // Filter out sensitive information
      const sanitizedUser = {
        id: updatedUser.id,
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        district: updatedUser.district,
        profilePicture: updatedUser.profilePicture,
        isActive: updatedUser.isActive,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      };
      
      res.status(200).json(sanitizedUser);
    } catch (error) {
      if (error instanceof Error) {
        console.error("User update error:", error.message);
        return res.status(500).json({ message: "Failed to update user", error: error.message });
      }
      next(error);
    }
  });
  
  // Special endpoint for mentor form user selection - simply lists all users
  app.get("/api/users-for-mentors", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Return a simplified list of users for dropdown selection
      console.log("Fetching users for mentor creation form");
      const result = await storage.getAllUsers(1, 1000); // Get up to 1000 users
      
      // Return a simplified list with minimal information
      const simplifiedUsers = result.users.map((user) => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName || user.username,
        email: user.email,
        role: user.role
      }));
      
      return res.status(200).json(simplifiedUsers);
    } catch (error) {
      next(error);
    }
  });
  
  // Delete a user (soft delete or mark as inactive)
  app.delete("/api/users/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Only administrators can delete users" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent deletion of the admin user
      if (user.role === "admin" && id === 1) {
        return res.status(403).json({ message: "Cannot delete the primary administrator account" });
      }
      
      // Delete the user (implement soft delete if available)
      await storage.deleteUser(id);
      
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      if (error instanceof Error) {
        console.error("User deletion error:", error.message);
        return res.status(500).json({ message: "Failed to delete user", error: error.message });
      }
      next(error);
    }
  });

  // Analytics/Stats API

  // Mentors API
  app.get("/api/mentors", async (req, res, next) => {
    try {
      const mentors = await storage.getAllMentors();
      res.status(200).json(mentors);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/mentors/:id", async (req, res, next) => {
    try {
      // Handle both numeric and string IDs by cleaning the input
      const idParam = req.params.id.trim();
      // Remove any non-numeric characters
      const cleanId = idParam.replace(/\D/g, '');
      const id = parseInt(cleanId);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const mentor = await storage.getMentor(id);
      
      if (!mentor) {
        return res.status(404).json({ message: "Mentor not found" });
      }
      
      res.status(200).json(mentor);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/mentors/district/:district", async (req, res, next) => {
    try {
      const district = req.params.district;
      const mentors = await storage.getMentorsByDistrict(district);
      res.status(200).json(mentors);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new mentor using an existing user account
  app.post("/api/mentors", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Extract data for the mentor
      const mentorData = req.body;
      console.log("Received mentor data:", mentorData);
      
      if (!mentorData.userId) {
        return res.status(400).json({ 
          message: "User ID is required to create a mentor profile"
        });
      }
      
      // Ensure assignedDistricts is always an array
      if (!mentorData.assignedDistricts || !Array.isArray(mentorData.assignedDistricts)) {
        mentorData.assignedDistricts = [];
      }
      
      // Set the primary district for the user (first district in the array)
      const primaryDistrict = mentorData.assignedDistricts.length > 0 
        ? mentorData.assignedDistricts[0] 
        : (mentorData.assignedDistrict || null);
      
      try {
        // Check if user exists first
        const user = await storage.getUser(mentorData.userId);
        if (!user) {
          return res.status(404).json({ 
            message: "User not found. Please select a valid user account." 
          });
        }

        // Update user role to mentor
        await storage.updateUser(user.id, { role: "mentor" });
        console.log(`Updated user ${user.id} role to mentor`);
        
        // Create mentor profile for the existing user
        // Make sure we populate both the legacy assignedDistrict field and the new assignedDistricts array
        const mentorWithDistricts = {
          ...mentorData,
          userId: user.id,
          assignedDistrict: primaryDistrict,
          assignedDistricts: mentorData.assignedDistricts,
        };
        
        const validatedData = insertMentorSchema.parse(mentorWithDistricts);
        
        const mentor = await storage.createMentor(validatedData);
        console.log("Created mentor:", mentor);
        
        res.status(201).json(mentor);
      } catch (error: unknown) {
        console.error("Error creating mentor profile:", error);
        let errorMessage = 'Unknown error';
        if (typeof error === 'object' && error !== null && 'message' in error) {
          errorMessage = String(error.message);
        }
        return res.status(500).json({ 
          message: "Failed to create mentor profile",
          error: errorMessage 
        });
      }
    } catch (error) {
      console.error("Mentor creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });
  
  // Update an existing mentor
  app.patch("/api/mentors/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Handle both numeric and string IDs by cleaning the input
      const idParam = req.params.id.trim();
      // Remove any non-numeric characters
      const cleanId = idParam.replace(/\D/g, '');
      const id = parseInt(cleanId);
      
      console.log(`Mentor update request for ID: ${id}`);
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      if (isNaN(id)) {
        console.error("Invalid mentor ID:", idParam);
        return res.status(400).json({ message: "Invalid mentor ID" });
      }
      
      // First check if the mentor exists
      const existingMentor = await storage.getMentor(id);
      if (!existingMentor) {
        console.error(`Mentor not found with ID: ${id}`);
        return res.status(404).json({ message: "Mentor not found" });
      }
      
      console.log("Existing mentor:", JSON.stringify(existingMentor, null, 2));
      
      const mentorData = req.body;
      
      // Ensure we handle districts properly
      if (mentorData.assignedDistricts && Array.isArray(mentorData.assignedDistricts)) {
        // Set the primary assignedDistrict field for backward compatibility
        mentorData.assignedDistrict = mentorData.assignedDistricts.length > 0 
          ? mentorData.assignedDistricts[0] 
          : null;
        console.log(`Setting primary district to: ${mentorData.assignedDistrict}`);
      } else if (mentorData.assignedDistrict && !mentorData.assignedDistricts) {
        // Ensure assignedDistricts includes the single district if that's all that was provided
        mentorData.assignedDistricts = [mentorData.assignedDistrict];
        console.log(`Created assignedDistricts array from single district: ${mentorData.assignedDistrict}`);
      }
      
      try {
        // Validate request body for partial update
        const validatedData = insertMentorSchema.partial().parse(mentorData);
        console.log("Validated mentor data:", JSON.stringify(validatedData, null, 2));
        
        // Before updating the mentor, check if we need to sync the name from the user
      if (existingMentor.userId) {
        try {
          // First get the user record to access the current fullName
          const user = await storage.getUser(existingMentor.userId);
          
          if (user) {
            // Update mentor name to match user fullName for consistency
            validatedData.name = user.fullName;
            console.log(`Syncing mentor name from user account: "${user.fullName}"`);
          }
        } catch (userError) {
          console.error("Error fetching user for name synchronization:", userError);
          // Continue anyway, as we can still update the mentor with provided data
        }
      }

      // Update the mentor with potentially modified data (name from user)
      const updatedMentor = await storage.updateMentor(id, validatedData);
      console.log("Updated mentor result:", JSON.stringify(updatedMentor, null, 2));
      
      if (!updatedMentor) {
        console.error(`No mentor was returned after update for ID: ${id}`);
        return res.status(500).json({ message: "Failed to update mentor - no data returned" });
      }
      
      // Update the corresponding user record with relevant data
      if (existingMentor.userId) {
        try {
          // Prepare user update data
          const userUpdateData: any = {};
          
          // Only sync email from mentor to user - name is synced from user to mentor
          if (mentorData.email) {
            userUpdateData.email = mentorData.email;
          }
            
            // Handle district updates
            if (mentorData.assignedDistricts) {
              // Get the primary district (first in the array) or null if empty
              const primaryDistrict = mentorData.assignedDistricts.length > 0 
                ? mentorData.assignedDistricts[0] 
                : null;
              
              userUpdateData.district = primaryDistrict;
            }
            
            // Only update if we have data to update
            if (Object.keys(userUpdateData).length > 0) {
              console.log(`Updating user ${existingMentor.userId} with data:`, JSON.stringify(userUpdateData, null, 2));
              
              try {
                // Update the user record with better error handling
                const updatedUser = await storage.updateUser(existingMentor.userId, userUpdateData);
                console.log("User update successful:", JSON.stringify(updatedUser, null, 2));
              } catch (updateError) {
                console.error("Error in storage.updateUser:", updateError);
                throw updateError; // Re-throw to be caught by outer try-catch
              }
            }
          } catch (userError) {
            console.error("Failed to update user information:", userError);
            // Continue anyway as the mentor was updated successfully
          }
        }
        
        res.status(200).json(updatedMentor);
      } catch (validationError) {
        console.error("Validation error:", validationError);
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({ 
            message: "Validation error", 
            errors: validationError.errors 
          });
        }
        throw validationError; // Re-throw for global error handler
      }
    } catch (error) {
      console.error("Error updating mentor:", error);
      next(error);
    }
  });
  
  // Delete a mentor
  app.delete("/api/mentors/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check permissions for deleting mentors (admin or has specific permission)
      const { role } = req.user!;
      // Admin role always has permission
      if (role !== "admin") {
        // Check if the user has the specific permission
        const hasPermission = await storage.hasPermission(role, "mentors", "delete");
        if (!hasPermission) {
          return res.status(403).json({ 
            message: "You don't have permission to delete mentors" 
          });
        }
      }
      
      // Handle both numeric and string IDs by cleaning the input
      const idParam = req.params.id.trim();
      // Remove any non-numeric characters
      const cleanId = idParam.replace(/\D/g, '');
      const id = parseInt(cleanId);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid mentor ID" });
      }
      
      // First check if the mentor exists
      const existingMentor = await storage.getMentor(id);
      if (!existingMentor) {
        return res.status(404).json({ message: "Mentor not found" });
      }
      
      // Check if mentor has any associated businesses
      const mentorBusinesses = await storage.getMentorBusinessRelationshipsByMentor(id);
      if (mentorBusinesses && mentorBusinesses.length > 0) {
        // Remove all mentor-business relationships first
        for (const relationship of mentorBusinesses) {
          await storage.removeMentorFromBusiness(id, relationship.businessId);
        }
      }
      
      // Check if mentor has any mentorship messages
      const mentorMessages = await storage.getMentorshipMessagesByMentorId(id);
      if (mentorMessages && mentorMessages.length > 0) {
        // Either delete messages or handle accordingly
        // For now, we'll just log a warning but proceed with deletion
        console.warn(`Deleting mentor with ${mentorMessages.length} mentorship messages`);
      }
      
      // Delete the mentor
      await storage.deleteMentor(id);
      
      res.status(200).json({ message: "Mentor deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Mentorship Messages API
  app.get("/api/mentorship-messages/mentor/:mentorId/business/:businessId", async (req, res, next) => {
    try {
      const mentorIdParam = req.params.mentorId.trim().replace(/\D/g, '');
      const businessIdParam = req.params.businessId.trim().replace(/\D/g, '');
      const mentorId = parseInt(mentorIdParam);
      const businessId = parseInt(businessIdParam);
      
      if (isNaN(mentorId) || isNaN(businessId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const messages = await storage.getMentorshipMessagesByMentorAndBusiness(mentorId, businessId);
      res.status(200).json(messages);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/mentorship-messages/mentor/:mentorId", async (req, res, next) => {
    try {
      const mentorIdParam = req.params.mentorId.trim().replace(/\D/g, '');
      const mentorId = parseInt(mentorIdParam);
      
      if (isNaN(mentorId)) {
        return res.status(400).json({ message: "Invalid mentor ID format" });
      }
      
      const messages = await storage.getMentorshipMessagesByMentorId(mentorId);
      res.status(200).json(messages);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/mentorship-messages/business/:businessId", async (req, res, next) => {
    try {
      const businessIdParam = req.params.businessId.trim().replace(/\D/g, '');
      const businessId = parseInt(businessIdParam);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Invalid business ID format" });
      }
      
      const messages = await storage.getMentorshipMessagesByBusinessId(businessId);
      res.status(200).json(messages);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/mentorship-messages", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Validate request body
      const validatedData = insertMentorshipMessageSchema.parse(req.body);
      const message = await storage.createMentorshipMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });

  // Analytics/Stats API
  app.get("/api/stats", async (req, res, next) => {
    try {
      // Get counts for dashboard statistics
      const profiles = await storage.getAllYouthProfiles();
      const businesses = await storage.getAllBusinessProfiles();
      const mentors = await storage.getAllMentors();
      
      // Count mentorship sessions (messages grouped by date)
      const allMessages = [];
      for (const mentor of mentors) {
        const mentorMessages = await storage.getMentorshipMessagesByMentorId(mentor.id);
        allMessages.push(...mentorMessages);
      }
      
      // Group messages by date to count sessions
      const sessionsMap = new Map();
      allMessages.forEach(msg => {
        if (msg.createdAt) {
          const dateKey = msg.createdAt.toISOString().split('T')[0];
          if (!sessionsMap.has(dateKey)) {
            sessionsMap.set(dateKey, new Set());
          }
          // Use businessId
          const businessId = msg.businessId || 0;
          sessionsMap.get(dateKey).add(`${msg.mentorId || 0}-${businessId}`);
        }
      });
      
      let totalSessions = 0;
      sessionsMap.forEach(sessions => {
        totalSessions += sessions.size;
      });
      
      // Calculate participants by district
      const districts = ["Bekwai", "Gushegu", "Lower Manya Krobo", "Yilo Krobo"];
      const districtCounts: Record<string, number> = {};
      
      // Initialize counts to zero for all districts
      districts.forEach(district => {
        districtCounts[district] = 0;
      });
      
      // Count profiles by district
      profiles.forEach(profile => {
        const district = profile.district || '';
        // Normalize district names to match our standard district names
        let normalizedDistrict = '';
        
        if (district.includes('Bekwai') || district === 'Bekwai') {
          normalizedDistrict = 'Bekwai';
        } else if (district.includes('Gushegu') || district === 'Gushegu') {
          normalizedDistrict = 'Gushegu';
        } else if (district.includes('Lower Manya') || district === 'Lower Manya Krobo') {
          normalizedDistrict = 'Lower Manya Krobo';
        } else if (district.includes('Yilo Krobo') || district === 'Yilo Krobo') {
          normalizedDistrict = 'Yilo Krobo';
        }
        
        if (normalizedDistrict && districtCounts[normalizedDistrict] !== undefined) {
          districtCounts[normalizedDistrict]++;
        }
      });
      
      // Filter districts to only include those that have participants
      const activeDistricts = districts.filter(district => districtCounts[district] > 0);
      
      // Count the number of districts that actually have data
      const districtsWithData = Object.entries(districtCounts)
        .filter(([_, count]) => count > 0)
        .length;
      
      // Return stats
      res.status(200).json({
        activeParticipants: profiles.length,
        activeBusinesses: businesses.length,
        mentorshipSessions: totalSessions,
        districts: activeDistricts,
        mentorsCount: mentors.length,
        districtCounts: districtCounts,
        districtsWithData: districtsWithData // new field for accurate count
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Reports API for detailed analytics
  app.get("/api/reports", async (req, res, next) => {
    try {
      const { period = 'all', type = 'summary', district = 'all', model = 'all' } = req.query;
      
      // Get the base data
      const profiles = await storage.getAllYouthProfiles();
      const businesses = await storage.getAllBusinessProfiles();
      const businessTracking = await storage.getAllBusinessTrackings();
      const mentors = await storage.getAllMentors();
      
      // Filter by period if needed
      const now = new Date();
      const filteredProfiles = profiles.filter(profile => {
        if (period === 'all') return true;
        
        const createdAt = profile.createdAt ? new Date(profile.createdAt) : null;
        if (!createdAt) return false;
        
        if (period === 'month') {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(now.getMonth() - 1);
          return createdAt >= oneMonthAgo;
        } else if (period === 'quarter') {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          return createdAt >= threeMonthsAgo;
        } else if (period === 'year') {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(now.getFullYear() - 1);
          return createdAt >= oneYearAgo;
        }
        
        return true;
      });
      
      // Filter by district if specified
      const districtFilteredProfiles = district === 'all' 
        ? filteredProfiles 
        : filteredProfiles.filter(p => p.district?.toLowerCase() === district);
      
      // Filter businesses by model if specified
      const modelFilteredBusinesses = model === 'all'
        ? businesses
        : businesses.filter(b => b.dareModel?.toLowerCase() === model);
        
      // Filter businesses by district if specified
      const filteredBusinesses = district === 'all'
        ? modelFilteredBusinesses
        : modelFilteredBusinesses.filter(b => b.district?.toLowerCase() === district);
      
      // Calculate statistics based on type
      let reportData = {};
      
      if (type === 'summary' || type === 'all') {
        // Get business counts by district
        const businessByDistrict = [
          { name: 'Bekwai', value: filteredBusinesses.filter(b => b.district === 'Bekwai').length },
          { name: 'Gushegu', value: filteredBusinesses.filter(b => b.district === 'Gushegu').length },
          { name: 'Lower Manya Krobo', value: filteredBusinesses.filter(b => b.district === 'Lower Manya Krobo').length },
          { name: 'Yilo Krobo', value: filteredBusinesses.filter(b => b.district === 'Yilo Krobo').length }
        ];
        
        // Get business model distribution
        const businessModelData = [
          { name: 'Collaborative', value: filteredBusinesses.filter(b => b.dareModel === 'Collaborative').length },
          { name: 'MakerSpace', value: filteredBusinesses.filter(b => b.dareModel === 'MakerSpace').length },
          { name: 'Madam Anchor', value: filteredBusinesses.filter(b => b.dareModel === 'Madam Anchor').length }
        ];
        
        // Get gender distribution
        const genderDistributionData = [
          { name: 'Male', value: districtFilteredProfiles.filter(p => p.gender?.toLowerCase() === 'male').length },
          { name: 'Female', value: districtFilteredProfiles.filter(p => p.gender?.toLowerCase() === 'female').length }
        ];
        
        // Calculate monthly registrations for trend
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const registrationsByMonth = Array(12).fill(0);
        
        districtFilteredProfiles.forEach(profile => {
          if (profile.createdAt) {
            const date = new Date(profile.createdAt);
            const month = date.getMonth();
            registrationsByMonth[month]++;
          }
        });
        
        const youthRegistrationData = monthNames.map((month, index) => ({
          month,
          count: registrationsByMonth[index]
        }));
        
        // Calculate average revenue if available
        let totalRevenue = 0;
        let countWithRevenue = 0;
        
        businessTracking.forEach(record => {
          if (record.actualRevenue && !isNaN(Number(record.actualRevenue))) {
            totalRevenue += Number(record.actualRevenue);
            countWithRevenue++;
          }
        });
        
        const averageRevenue = countWithRevenue > 0 ? (totalRevenue / countWithRevenue).toFixed(2) : 0;
        
        reportData = {
          summary: {
            totalYouth: districtFilteredProfiles.length,
            totalBusinesses: filteredBusinesses.length,
            averageRevenue,
            activeDistricts: [...new Set(districtFilteredProfiles.map(p => p.district))].filter(Boolean).length,
          },
          businessByDistrict,
          youthRegistrationData,
          businessModelData,
          genderDistributionData
        };
      }
      
      if (type === 'participants' || type === 'all') {
        // Get participants by district
        const participantsByDistrict = [
          { name: 'Bekwai', value: districtFilteredProfiles.filter(p => p.district === 'Bekwai').length },
          { name: 'Gushegu', value: districtFilteredProfiles.filter(p => p.district === 'Gushegu').length },
          { name: 'Lower Manya Krobo', value: districtFilteredProfiles.filter(p => p.district === 'Lower Manya Krobo').length },
          { name: 'Yilo Krobo', value: districtFilteredProfiles.filter(p => p.district === 'Yilo Krobo').length }
        ];
        
        // Get age groups distribution
        const ageGroups = {
          'Under 18': 0,
          '18-24': 0,
          '25-34': 0,
          '35-44': 0,
          '45+': 0
        };
        
        districtFilteredProfiles.forEach(profile => {
          const age = profile.age || 0;
          
          if (age < 18) ageGroups['Under 18']++;
          else if (age >= 18 && age <= 24) ageGroups['18-24']++;
          else if (age >= 25 && age <= 34) ageGroups['25-34']++;
          else if (age >= 35 && age <= 44) ageGroups['35-44']++;
          else if (age >= 45) ageGroups['45+']++;
        });
        
        const ageGroupData = Object.entries(ageGroups).map(([name, value]) => ({ name, value }));
        
        // Get training status distribution
        const trainingStatusData = [
          { name: 'Completed', value: districtFilteredProfiles.filter(p => p.trainingStatus?.toLowerCase() === 'completed').length },
          { name: 'In Progress', value: districtFilteredProfiles.filter(p => p.trainingStatus?.toLowerCase() === 'in progress').length },
          { name: 'Not Started', value: districtFilteredProfiles.filter(p => p.trainingStatus?.toLowerCase() === 'not started' || !p.trainingStatus).length }
        ];
        
        reportData = {
          ...reportData,
          participantsByDistrict,
          ageGroupData,
          trainingStatusData
        };
      }
      
      if (type === 'businesses' || type === 'all') {
        // Get businesses by revenue tier (from tracking data)
        const businessesWithTracking = filteredBusinesses.map(business => {
          const tracking = businessTracking.filter(t => t.businessId === business.id);
          const latestTracking = tracking.sort((a, b) => {
            const dateA = a.trackingDate ? new Date(a.trackingDate).getTime() : 0;
            const dateB = b.trackingDate ? new Date(b.trackingDate).getTime() : 0;
            return dateB - dateA;
          })[0] || {};
          
          return {
            ...business,
            latestRevenue: latestTracking.actualRevenue || 0
          };
        });
        
        const revenueTiers = {
          'Low (0-500 GHS)': 0,
          'Medium (501-1000 GHS)': 0,
          'High (1000+ GHS)': 0
        };
        
        businessesWithTracking.forEach(business => {
          const revenue = Number(business.latestRevenue) || 0;
          
          if (revenue <= 500) revenueTiers['Low (0-500 GHS)']++;
          else if (revenue > 500 && revenue <= 1000) revenueTiers['Medium (501-1000 GHS)']++;
          else if (revenue > 1000) revenueTiers['High (1000+ GHS)']++;
        });
        
        const revenueTierData = Object.entries(revenueTiers).map(([name, value]) => ({ name, value }));
        
        // Get business models (since stages aren't available)
        const businessStages = {
          'New': 0,
          'Developing': 0,
          'Established': 0
        };
        
        filteredBusinesses.forEach(business => {
          const model = business.businessModel?.toLowerCase() || '';
          
          if (model.includes('new') || model.includes('startup')) businessStages['New']++;
          else if (model.includes('grow') || model.includes('develop')) businessStages['Developing']++;
          else businessStages['Established']++;
        });
        
        const businessStageData = Object.entries(businessStages).map(([name, value]) => ({ name, value }));
        
        reportData = {
          ...reportData,
          revenueTierData,
          businessStageData
        };
      }
      
      if (type === 'performance' || type === 'all') {
        // Calculate performance metrics
        // - Revenue growth over time
        const revenueByMonth = {};
        
        businessTracking.forEach(record => {
          if (record.trackingDate && record.actualRevenue) {
            const date = new Date(record.trackingDate);
            const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
            
            if (!revenueByMonth[monthYear]) {
              revenueByMonth[monthYear] = {
                totalRevenue: 0,
                count: 0,
                month: date.toLocaleString('default', { month: 'short' }),
                year: date.getFullYear()
              };
            }
            
            revenueByMonth[monthYear].totalRevenue += Number(record.actualRevenue) || 0;
            revenueByMonth[monthYear].count++;
          }
        });
        
        const revenueGrowthData = Object.values(revenueByMonth).map(data => ({
          name: `${data.month} ${data.year}`,
          value: data.count > 0 ? data.totalRevenue / data.count : 0
        })).sort((a, b) => {
          const nameA = a.name.split(' ');
          const nameB = b.name.split(' ');
          
          const yearA = parseInt(nameA[1]);
          const yearB = parseInt(nameB[1]);
          
          if (yearA !== yearB) return yearA - yearB;
          
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthA = months.indexOf(nameA[0]);
          const monthB = months.indexOf(nameB[0]);
          
          return monthA - monthB;
        });
        
        reportData = {
          ...reportData,
          revenueGrowthData
        };
      }
      
      // Return the report data
      res.status(200).json(reportData);
    } catch (error) {
      next(error);
    }
  });

  // Recent Activities API (simplified version)
  app.get("/api/activities", async (req, res, next) => {
    try {
      // Create a list of recent activities based on profiles, businesses and mentorship messages
      const activities = [];
      
      // Get recent profiles
      const profiles = await storage.getAllYouthProfiles();
      const sortedProfiles = [...profiles].filter(p => p.createdAt).sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      // Add up to 5 most recent profiles as activities
      for (let i = 0; i < Math.min(5, sortedProfiles.length); i++) {
        const profile = sortedProfiles[i];
        if (profile.createdAt) {
          activities.push({
            id: `profile-${profile.id}`,
            type: 'profile',
            content: `${profile.fullName} joined the program from ${profile.district} district`,
            timestamp: profile.createdAt,
            icon: 'user-add'
          });
        }
      }
      
      // Get recent businesses
      const businesses = await storage.getAllBusinessProfiles();
      const sortedBusinesses = [...businesses].filter(b => b.createdAt).sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      // Add up to 5 most recent businesses as activities
      for (let i = 0; i < Math.min(5, sortedBusinesses.length); i++) {
        const business = sortedBusinesses[i];
        if (business.createdAt) {
          activities.push({
            id: `business-${business.id}`,
            type: 'business',
            content: `${business.businessName} business was registered in ${business.district} district`,
            timestamp: business.createdAt,
            icon: 'briefcase'
          });
        }
      }
      
      // Get recent mentors
      const mentors = await storage.getAllMentors();
      const sortedMentors = [...mentors].filter(m => m.createdAt).sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      // Add up to 5 most recent mentors as activities
      for (let i = 0; i < Math.min(5, sortedMentors.length); i++) {
        const mentor = sortedMentors[i];
        if (mentor.createdAt) {
          const district = mentor.assignedDistrict || 'multiple districts';
          activities.push({
            id: `mentor-${mentor.id}`,
            type: 'mentor',
            content: `${mentor.name} joined as a mentor for ${district}`,
            timestamp: mentor.createdAt,
            icon: 'users'
          });
        }
      }
      
      // Sort by timestamp
      const sortedActivities = activities.filter(a => a.timestamp).sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
      
      // Return most recent activities
      res.status(200).json(sortedActivities.slice(0, 10));
    } catch (error) {
      next(error);
    }
  });
  
  // User permissions endpoint
  app.get("/api/user-permissions", async (req, res, next) => {
    try {
      getUserPermissions(req, res);
    } catch (error) {
      next(error);
    }
  });

  return httpServer;
}
