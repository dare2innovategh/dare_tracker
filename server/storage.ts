import { 
  users, type User, type InsertUser, 
  youthProfiles, type YouthProfile, type InsertYouthProfileSchema, 
  businessProfiles, type BusinessProfile, type InsertBusinessProfile,
  businessYouthRelationships, type BusinessYouthRelationship, type InsertBusinessYouthRelationship,
  mentors, type Mentor, type InsertMentor, 
  mentorshipMessages, type MentorshipMessage, type InsertMentorshipMessage,
  mentorBusinessRelationships, type MentorBusinessRelationship, type InsertMentorBusinessRelationship,
  businessAdvice, type BusinessAdvice, type InsertBusinessAdvice,
  rolePermissions, type RolePermission, type InsertRolePermission,
  roles, type Role, type InsertRole,
  customRoles,
  permissions, type Permission, type InsertPermission,
  businessTracking, type BusinessTracking, type InsertBusinessTracking,
  businessTrackingAttachments, type BusinessTrackingAttachment, type InsertBusinessTrackingAttachment,
  permissionActionEnum, type PermissionAction,
  permissionResourceEnum, type PermissionResource
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, sql, inArray, desc } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);

// Create a PostgreSQL session store for database implementation
const PostgresSessionStore = connectPg(session);

// Interface with CRUD methods for storage operations
export interface IStorage {
  // User Management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(page?: number, limit?: number): Promise<{ users: User[]; total: number }>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  
  // Role and Permission Management
  getRolePermission(id: number): Promise<RolePermission | undefined>;
  getRolePermissionsByRole(role: string): Promise<RolePermission[]>;
  getAllRolePermissions(): Promise<RolePermission[]>;
  hasPermission(role: string, resource: string, action: string): Promise<boolean>;
  createRolePermission(permission: InsertRolePermission): Promise<RolePermission>;
  deleteRolePermission(rolePermission: InsertRolePermission): Promise<void>;
  deleteRolePermissionsByRole(role: string): Promise<void>;
  checkRolePermissionExists(role: string, resource: string, action: string): Promise<RolePermission | undefined>;
  
  // Roles Management
  getRole(id: number): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  getAllRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<void>;
  
  // Permissions Management
  getPermission(id: number): Promise<Permission | undefined>;
  getPermissionByResourceAction(resource: PermissionResource, action: PermissionAction): Promise<Permission | undefined>;
  getAllPermissions(): Promise<Permission[]>;
  getPermissionsByModule(module: string): Promise<Permission[]>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission | undefined>;
  deletePermission(id: number): Promise<void>;
  
  // Youth Profiles
  getYouthProfile(id: number): Promise<YouthProfile | undefined>;
  getYouthProfileByUserId(userId: number): Promise<YouthProfile | undefined>;
  getYouthProfilesByDistrict(district: string): Promise<YouthProfile[]>;
  getAllYouthProfiles(): Promise<YouthProfile[]>;
  createYouthProfile(profile: InsertYouthProfileSchema): Promise<YouthProfile>;
  updateYouthProfile(id: number, profile: Partial<InsertYouthProfileSchema>): Promise<YouthProfile | undefined>;
  deleteYouthProfile(id: number): Promise<void>;
  
  // Business Profiles
  getBusinessProfile(id: number): Promise<BusinessProfile | undefined>;
  getBusinessProfileByName(name: string): Promise<BusinessProfile | undefined>;
  getBusinessProfilesByDistrict(district: string): Promise<BusinessProfile[]>;
  getAllBusinessProfiles(): Promise<BusinessProfile[]>;
  createBusinessProfile(profile: InsertBusinessProfile): Promise<BusinessProfile>;
  updateBusinessProfile(id: number, profile: Partial<InsertBusinessProfile>): Promise<BusinessProfile | undefined>;
  
  // Business-Youth Relationships
  getBusinessYouthRelationships(businessId: number): Promise<BusinessYouthRelationship[]>;
  getYouthBusinesses(youthId: number): Promise<BusinessProfile[]>;
  getAllYouthBusinessRelationships(): Promise<Record<number, BusinessProfile[]>>;
  addYouthToBusiness(relation: InsertBusinessYouthRelationship): Promise<BusinessYouthRelationship>;
  removeYouthFromBusiness(businessId: number, youthId: number): Promise<void>;
  updateYouthBusinessRole(businessId: number, youthId: number, role: string): Promise<BusinessYouthRelationship | undefined>;
  
  // Mentor-Business Relationships
  getMentorBusinessRelationship(mentorId: number, businessId: number): Promise<MentorBusinessRelationship | undefined>;
  getBusinessesForMentor(mentorId: number): Promise<BusinessProfile[]>;
  getMentorsForBusiness(businessId: number): Promise<Mentor[]>;
  getAllMentorBusinessRelationships(): Promise<MentorBusinessRelationship[]>;
  addMentorToBusiness(relation: InsertMentorBusinessRelationship): Promise<MentorBusinessRelationship>;
  removeMentorFromBusiness(mentorId: number, businessId: number): Promise<void>;
  updateMentorBusinessRelationship(mentorId: number, businessId: number, data: Partial<InsertMentorBusinessRelationship>): Promise<MentorBusinessRelationship | undefined>;
  clearAllMentorBusinessRelationships(): Promise<void>;
  

  
  // Mentors
  getMentor(id: number): Promise<Mentor | undefined>;
  getMentorByUserId(userId: number): Promise<Mentor | undefined>;
  getMentorsByDistrict(district: string): Promise<Mentor[]>;
  getAllMentors(): Promise<Mentor[]>;
  createMentor(mentor: InsertMentor): Promise<Mentor>;
  updateMentor(id: number, mentor: Partial<InsertMentor>): Promise<Mentor | undefined>;
  
  // Mentorship Messages (updated for business focus)
  getMentorshipMessage(id: number): Promise<MentorshipMessage | undefined>;
  getMentorshipMessagesByMentorId(mentorId: number): Promise<MentorshipMessage[]>;
  getMentorshipMessagesByBusinessId(businessId: number): Promise<MentorshipMessage[]>;
  getMentorshipMessagesByMentorAndBusiness(mentorId: number, businessId: number): Promise<MentorshipMessage[]>;
  createMentorshipMessage(message: InsertMentorshipMessage): Promise<MentorshipMessage>;
  
  // Business Advice (structured mentorship advice)
  getAllBusinessAdvice(): Promise<BusinessAdvice[]>;
  getBusinessAdviceById(id: number): Promise<BusinessAdvice | undefined>;
  getBusinessAdviceByBusinessId(businessId: number): Promise<BusinessAdvice[]>;
  getBusinessAdviceByMentorId(mentorId: number): Promise<BusinessAdvice[]>;
  getBusinessAdviceByMentorAndBusiness(mentorId: number, businessId: number): Promise<BusinessAdvice[]>;
  createBusinessAdvice(advice: InsertBusinessAdvice): Promise<BusinessAdvice>;
  updateBusinessAdvice(id: number, advice: Partial<InsertBusinessAdvice>): Promise<BusinessAdvice | undefined>;
  deleteBusinessAdvice(id: number): Promise<void>;
  
  // Business Tracking
  getBusinessTracking(id: number): Promise<BusinessTracking | undefined>;
  getAllBusinessTrackings(): Promise<BusinessTracking[]>;
  getBusinessTrackingsByBusinessId(businessId: number): Promise<BusinessTracking[]>;
  getBusinessTrackingsByMentorId(mentorId: number): Promise<BusinessTracking[]>;
  createBusinessTracking(tracking: InsertBusinessTracking): Promise<BusinessTracking>;
  updateBusinessTracking(id: number, data: Partial<InsertBusinessTracking>): Promise<BusinessTracking | undefined>;
  deleteBusinessTracking(id: number): Promise<void>;
  verifyBusinessTracking(id: number, verifiedBy: number): Promise<BusinessTracking | undefined>;
  
  // Business Tracking Attachments
  getBusinessTrackingAttachment(id: number): Promise<BusinessTrackingAttachment | undefined>;
  getBusinessTrackingAttachmentsByTrackingId(trackingId: number): Promise<BusinessTrackingAttachment[]>;
  createBusinessTrackingAttachment(attachment: InsertBusinessTrackingAttachment): Promise<BusinessTrackingAttachment>;
  deleteBusinessTrackingAttachment(id: number): Promise<void>;
  
  // Session
  sessionStore: any; // Using any to avoid SessionStore type issues
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private youthProfiles: Map<number, YouthProfile>;

  private mentors: Map<number, Mentor>;
  private mentorshipMessages: Map<number, MentorshipMessage>;
  private businessAdvice: Map<number, BusinessAdvice>;
  private rolePermissions: Map<number, RolePermission>;
  private roles: Map<number, Role>;
  private permissions: Map<number, Permission>;
  
  // ID counters
  private userIdCounter: number;
  private youthProfileIdCounter: number;

  private mentorIdCounter: number;
  private mentorshipMessageIdCounter: number;
  private businessAdviceIdCounter: number;
  private rolePermissionIdCounter: number;
  private roleIdCounter: number;
  private permissionIdCounter: number;
  
  // Session store
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.youthProfiles = new Map();

    this.mentors = new Map();
    this.mentorshipMessages = new Map();
    this.businessAdvice = new Map();
    this.rolePermissions = new Map();
    this.roles = new Map();
    this.permissions = new Map();
    
    this.userIdCounter = 1;
    this.youthProfileIdCounter = 1;

    this.mentorIdCounter = 1;
    this.mentorshipMessageIdCounter = 1;
    this.businessAdviceIdCounter = 1;
    this.rolePermissionIdCounter = 1;
    this.roleIdCounter = 1;
    this.permissionIdCounter = 1;
    
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours in ms
    });
    
    // Add initial mentors as per project requirements
    this.seedMentors();
    
    // Seed default role permissions for admin
    this.seedRolePermissions();
  }
  
  // Role Permission Methods
  async getRolePermission(id: number): Promise<RolePermission | undefined> {
    return this.rolePermissions.get(id);
  }
  
  async getRolePermissionsByRole(role: string): Promise<RolePermission[]> {
    return Array.from(this.rolePermissions.values()).filter(
      (permission) => permission.role === role
    );
  }
  
  async getAllRolePermissions(): Promise<RolePermission[]> {
    return Array.from(this.rolePermissions.values());
  }
  
  async hasPermission(role: string, resource: string, action: string): Promise<boolean> {
    // Admin always has all permissions
    if (role === 'admin') return true;
    
    // Check if the role has the specific permission
    return Array.from(this.rolePermissions.values()).some(
      (permission) => 
        permission.role === role && 
        permission.resource === resource && 
        permission.action === action
    );
  }
  
  async createRolePermission(permission: InsertRolePermission): Promise<RolePermission> {
    const id = this.rolePermissionIdCounter++;
    const now = new Date();
    const rolePermission: RolePermission = { 
      ...permission, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.rolePermissions.set(id, rolePermission);
    return rolePermission;
  }
  
  async deleteRolePermission(rolePermission: InsertRolePermission): Promise<void> {
    const permissions = Array.from(this.rolePermissions.values()).filter(
      (p) => 
        p.role === rolePermission.role && 
        p.resource === rolePermission.resource && 
        p.action === rolePermission.action
    );
    
    if (permissions.length > 0) {
      for (const permission of permissions) {
        this.rolePermissions.delete(permission.id);
      }
    }
  }
  
  async deleteAllRolePermissions(role: string): Promise<void> {
    const permissions = Array.from(this.rolePermissions.values()).filter(
      (p) => p.role === role
    );
    
    for (const permission of permissions) {
      this.rolePermissions.delete(permission.id);
    }
  }
  
  // Helper method to seed initial role permissions for admin
  private seedRolePermissions() {
    // Admin has all permissions
    const resources = ["users", "profiles", "businesses", "mentors", "reports", "settings", "permissions"];
    const actions = ["view", "create", "edit", "delete", "manage"];
    
    // Admin permissions (all resources, all actions)
    for (const resource of resources) {
      for (const action of actions) {
        const id = this.rolePermissionIdCounter++;
        const now = new Date();
        const permission: RolePermission = {
          id,
          role: "admin",
          resource, 
          action,
          createdAt: now,
          updatedAt: now
        };
        this.rolePermissions.set(id, permission);
      }
    }
    
    // Mentor permissions
    const mentorResources = ["profiles", "businesses", "reports"];
    const mentorViewActions = ["view"];
    const mentorEditActions = ["edit"];
    
    for (const resource of mentorResources) {
      // Mentors can view all resources in their allowed list
      for (const action of mentorViewActions) {
        const id = this.rolePermissionIdCounter++;
        const now = new Date();
        const permission: RolePermission = {
          id,
          role: "mentor",
          resource,
          action,
          createdAt: now,
          updatedAt: now
        };
        this.rolePermissions.set(id, permission);
      }
      
      // Mentors can edit reports
      if (resource === "reports") {
        for (const action of mentorEditActions) {
          const id = this.rolePermissionIdCounter++;
          const now = new Date();
          const permission: RolePermission = {
            id,
            role: "mentor",
            resource,
            action,
            createdAt: now,
            updatedAt: now
          };
          this.rolePermissions.set(id, permission);
        }
      }
    }
  }
  
  // User Management Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Youth Profile Methods
  async getYouthProfile(id: number): Promise<YouthProfile | undefined> {
    return this.youthProfiles.get(id);
  }
  
  async getYouthProfileByUserId(userId: number): Promise<YouthProfile | undefined> {
    return Array.from(this.youthProfiles.values()).find(
      (profile) => profile.userId === userId,
    );
  }
  
  async getYouthProfilesByDistrict(district: string): Promise<YouthProfile[]> {
    return Array.from(this.youthProfiles.values()).filter(
      (profile) => profile.district === district,
    );
  }
  
  async getAllYouthProfiles(): Promise<YouthProfile[]> {
    return Array.from(this.youthProfiles.values());
  }
  
  async createYouthProfile(profile: InsertYouthProfileSchema): Promise<YouthProfile> {
    try {
      console.log('Creating new youth profile');
      
      // Process the profile data to ensure JSON fields are valid
      const processedProfile = this.processYouthProfileData(profile);
      
      // Extract keys and values for SQL query
      const keys = Object.keys(processedProfile);
      const placeholders = keys.map((_, index) => `$${index + 1}`);
      const values = keys.map(key => processedProfile[key]);
      
      // Construct the query
      const query = `
        INSERT INTO youth_profiles (${keys.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;
      
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating youth profile:', error);
      throw error;
    }
  }
  
  async updateYouthProfile(id: number, profileData: Partial<InsertYouthProfileSchema>): Promise<YouthProfile | undefined> {
    try {
      console.log(`Updating youth profile ID: ${id}`);
      console.log("Received update data:", profileData);
      
      // First, process the data to ensure all fields are properly formatted
      // This is where JSON fields, 'None' values, etc. are properly handled
      const processedData = this.processYouthProfileData(profileData);
      console.log("Processed update data:", processedData);
      
      // Now prepare data for the SQL query
      const keys = Object.keys(processedData).filter(key => key !== 'id');
      if (keys.length === 0) {
        console.log('No fields to update');
        // If nothing to update, get and return the current profile
        const result = await this.getYouthProfile(id);
        if (!result) {
          throw new Error(`Youth profile with ID ${id} not found`);
        }
        return result;
      }
      
      // Build the SET clause and values for the query
      const setClauses = [];
      const values = [];
      let paramIndex = 1;
      
      for (const key of keys) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(processedData[key]);
        paramIndex++;
      }
      
      // Execute the update query
      const query = `
        UPDATE youth_profiles
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      values.push(id);
      
      const result = await this.pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error(`Youth profile with ID ${id} not found`);
      }
      
      console.log("Profile updated successfully");
      return result.rows[0];
    } catch (error) {
      console.error('Error updating youth profile:', error);
      throw error;
    }
  }
  // Helper method to process youth profile data and handle special fields
  private processYouthProfileData(data: Partial<InsertYouthProfileSchema>): Partial<InsertYouthProfileSchema> {
    // Create a copy to avoid modifying the input
    const processed = { ...data };
    
    console.log("Processing profile data, before:", JSON.stringify(processed, null, 2));
    
    // Handle JSON fields
    const jsonFields = ['emergencyContact', 'apprenticeNames', 'languagesSpoken'];
    jsonFields.forEach(field => {
      if (field in processed) {
        const value = processed[field];
        console.log(`Processing JSON field ${field}, original value:`, value);
        
        // Handle null, empty strings, or "None"
        if (value === null || value === '' || value === 'None') {
          // Set default empty values based on field type
          if (field === 'emergencyContact') {
            processed[field] = JSON.stringify({
              name: '',
              relation: '',
              phone: '',
              email: '',
              address: ''
            });
          } else {
            // For array fields
            processed[field] = JSON.stringify([]);
          }
          console.log(`Empty value detected in ${field}, setting default:`, processed[field]);
        } else if (typeof value === 'object') {
          // If it's already an object, stringify it
          processed[field] = JSON.stringify(value);
          console.log(`Object value detected in ${field}, stringified:`, processed[field]);
        } else if (typeof value === 'string') {
          try {
            // Try parsing it to validate JSON
            JSON.parse(value);
            // If it parses successfully, it's already a valid JSON string
            console.log(`Valid JSON string detected in ${field}, keeping as is`);
          } catch (e) {
            // If parsing fails, it's not a valid JSON string
            console.warn(`Invalid JSON in ${field}, value: "${value}", replacing with default`);
            if (field === 'emergencyContact') {
              processed[field] = JSON.stringify({
                name: '',
                relation: '',
                phone: '',
                email: '',
                address: ''
              });
            } else {
              processed[field] = JSON.stringify([]);
            }
            console.log(`Replaced invalid JSON in ${field} with:`, processed[field]);
          }
        }
      }
    });
    
    // Process text fields that might contain "None" or "Not Specified"
    const textFields = ['workHistory', 'businessInterest', 'programDetails', 'specificJob', 'coreSkills', 'skillLevel', 
                        'guarantor', 'guarantorPhone', 'madamName', 'madamPhone', 'localMentorName', 'localMentorContact'];
    
    textFields.forEach(field => {
      if (field in processed && processed[field] !== null) {
        if (processed[field] === 'None' || processed[field] === 'Not Specified') {
          console.log(`Replacing "${processed[field]}" in ${field} with empty string`);
          processed[field] = '';
        }
      }
    });
    
    // Handle date fields
    const dateFields = ['dateOfBirth', 'partnerStartDate'];
    dateFields.forEach(field => {
      if (field in processed && processed[field] !== null) {
        if (typeof processed[field] === 'string') {
          try {
            processed[field] = new Date(processed[field]);
            console.log(`Converted string date in ${field} to Date object:`, processed[field]);
          } catch (e) {
            console.warn(`Invalid date in ${field}, setting to null`);
            processed[field] = null;
          }
        }
      }
    });
    
    // Convert empty strings to null for non-JSON fields
    Object.keys(processed).forEach(key => {
      if (processed[key] === '' && !jsonFields.includes(key)) {
        console.log(`Converting empty string in ${key} to null`);
        processed[key] = null;
      }
    });
    
    console.log("Processing profile data, after:", JSON.stringify(processed, null, 2));
    return processed;
  }
  async deleteYouthProfile(id: number): Promise<void> {
    const profile = await this.getYouthProfile(id);
    if (!profile) {
      throw new Error(`Youth profile with ID ${id} not found`);
    }
    
    this.youthProfiles.delete(id);
  }
  

  
  // Mentor Methods
  async getMentor(id: number): Promise<Mentor | undefined> {
    return this.mentors.get(id);
  }
  
  async getMentorByUserId(userId: number): Promise<Mentor | undefined> {
    return Array.from(this.mentors.values()).find(
      (mentor) => mentor.userId === userId,
    );
  }
  
  async getMentorsByDistrict(district: string): Promise<Mentor[]> {
    return Array.from(this.mentors.values()).filter(
      (mentor) => mentor.assignedDistrict === district,
    );
  }
  
  async getAllMentors(): Promise<Mentor[]> {
    return Array.from(this.mentors.values());
  }
  
  async createMentor(mentor: InsertMentor): Promise<Mentor> {
    const id = this.mentorIdCounter++;
    const now = new Date();
    const newMentor: Mentor = { ...mentor, id, createdAt: now };
    this.mentors.set(id, newMentor);
    return newMentor;
  }
  
  async updateMentor(id: number, mentorData: Partial<InsertMentor>): Promise<Mentor | undefined> {
    const mentor = await this.getMentor(id);
    if (!mentor) return undefined;
    
    const updatedMentor = { ...mentor, ...mentorData };
    this.mentors.set(id, updatedMentor);
    return updatedMentor;
  }
  
  async deleteMentor(id: number): Promise<boolean> {
    if (!this.mentors.has(id)) return false;
    return this.mentors.delete(id);
  }
  
  // Mentorship Message Methods
  async getMentorshipMessage(id: number): Promise<MentorshipMessage | undefined> {
    return this.mentorshipMessages.get(id);
  }
  
  async getMentorshipMessagesByMentorId(mentorId: number): Promise<MentorshipMessage[]> {
    return Array.from(this.mentorshipMessages.values()).filter(
      (message) => message.mentorId === mentorId,
    );
  }
  
  async getMentorshipMessagesByBusinessId(businessId: number): Promise<MentorshipMessage[]> {
    return Array.from(this.mentorshipMessages.values()).filter(
      // Match by businessId
      (message) => message.businessId === businessId,
    );
  }
  
  async getMentorshipMessagesByMentorAndBusiness(mentorId: number, businessId: number): Promise<MentorshipMessage[]> {
    return Array.from(this.mentorshipMessages.values()).filter(
      (message) => message.mentorId === mentorId && message.businessId === businessId,
    );
  }
  
  async createMentorshipMessage(message: InsertMentorshipMessage): Promise<MentorshipMessage> {
    const id = this.mentorshipMessageIdCounter++;
    
    // For memory storage, we can safely store businessId but should also add menteeId for consistency
    const messageToInsert = { ...message };
    if ('businessId' in messageToInsert) {
      // @ts-ignore: Add menteeId for compatibility with DB schema
      messageToInsert.menteeId = messageToInsert.businessId;
    }
    const now = new Date();
    const newMessage: MentorshipMessage = { ...message, id, createdAt: now };
    this.mentorshipMessages.set(id, newMessage);
    return newMessage;
  }
  
  // Roles Management Methods
  async getRole(id: number): Promise<Role | undefined> {
    return this.roles.get(id);
  }
  
  async getRoleByName(name: string): Promise<Role | undefined> {
    return Array.from(this.roles.values()).find(
      role => role.name === name
    );
  }
  
  async getAllRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }
  
  async createRole(role: InsertRole): Promise<Role> {
    const id = this.roleIdCounter++;
    const now = new Date();
    const newRole: Role = {
      ...role,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.roles.set(id, newRole);
    return newRole;
  }
  
  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role | undefined> {
    const role = await this.getRole(id);
    if (!role) return undefined;
    
    const now = new Date();
    const updatedRole = { 
      ...role, 
      ...roleData, 
      updatedAt: now 
    };
    this.roles.set(id, updatedRole);
    return updatedRole;
  }
  
  async deleteRole(id: number): Promise<void> {
    const role = await this.getRole(id);
    if (!role) {
      throw new Error(`Role with ID ${id} not found`);
    }
    
    // Delete all permissions for this role
    await this.deleteAllRolePermissions(role.name);
    
    // Then delete the role
    this.roles.delete(id);
  }
  
  // Permissions Management Methods
  async getPermission(id: number): Promise<Permission | undefined> {
    return this.permissions.get(id);
  }
  
  async getPermissionByResourceAction(resource: PermissionResource, action: PermissionAction): Promise<Permission | undefined> {
    return Array.from(this.permissions.values()).find(
      perm => perm.resource === resource && perm.action === action
    );
  }
  
  async getAllPermissions(): Promise<Permission[]> {
    return Array.from(this.permissions.values());
  }
  
  async getPermissionsByModule(module: string): Promise<Permission[]> {
    return Array.from(this.permissions.values()).filter(
      perm => perm.module === module
    );
  }
  
  async createPermission(permission: InsertPermission): Promise<Permission> {
    const id = this.permissionIdCounter++;
    const now = new Date();
    const newPermission: Permission = {
      ...permission,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.permissions.set(id, newPermission);
    return newPermission;
  }
  
  async updatePermission(id: number, permData: Partial<InsertPermission>): Promise<Permission | undefined> {
    const permission = await this.getPermission(id);
    if (!permission) return undefined;
    
    const now = new Date();
    const updatedPermission = { 
      ...permission, 
      ...permData, 
      updatedAt: now 
    };
    this.permissions.set(id, updatedPermission);
    return updatedPermission;
  }
  
  async deletePermission(id: number): Promise<void> {
    const permission = await this.getPermission(id);
    if (!permission) {
      throw new Error(`Permission with ID ${id} not found`);
    }
    
    this.permissions.delete(id);
  }
  
  // Role Permission Junction Methods
  async checkRolePermissionExists(role: string, resource: string, action: string): Promise<RolePermission | undefined> {
    return Array.from(this.rolePermissions.values()).find(
      rp => rp.role === role && rp.resource === resource && rp.action === action
    );
  }
  
  async deleteRolePermissionsByRole(role: string): Promise<void> {
    // This is an alias for deleteAllRolePermissions for API compatibility
    await this.deleteAllRolePermissions(role);
  }
  
  // Required by IStorage interface but already implemented as getAllUsers
  async getAllUsers(page?: number, limit?: number): Promise<{ users: User[]; total: number }> {
    const allUsers = Array.from(this.users.values());
    const total = allUsers.length;
    
    // If pagination is requested, apply it
    if (page !== undefined && limit !== undefined) {
      const pageNum = page || 1;
      const pageSize = limit || 10;
      const startIndex = (pageNum - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      return {
        users: allUsers.slice(startIndex, endIndex),
        total
      };
    }
    
    // Otherwise return all users
    return {
      users: allUsers,
      total
    };
  }
  
  // Required by IStorage interface but already implemented in a different form
  async deleteUser(id: number): Promise<void> {
    if (!this.users.delete(id)) {
      throw new Error(`User with ID ${id} not found`);
    }
  }
  
  // Business Advice Methods
  async getAllBusinessAdvice(): Promise<BusinessAdvice[]> {
    return Array.from(this.businessAdvice.values());
  }
  
  async getBusinessAdviceById(id: number): Promise<BusinessAdvice | undefined> {
    return this.businessAdvice.get(id);
  }
  
  async getBusinessAdviceByBusinessId(businessId: number): Promise<BusinessAdvice[]> {
    return Array.from(this.businessAdvice.values()).filter(
      (advice) => advice.businessId === businessId
    );
  }
  
  async getBusinessAdviceByMentorId(mentorId: number): Promise<BusinessAdvice[]> {
    return Array.from(this.businessAdvice.values()).filter(
      (advice) => advice.mentorId === mentorId
    );
  }
  
  async getBusinessAdviceByMentorAndBusiness(mentorId: number, businessId: number): Promise<BusinessAdvice[]> {
    return Array.from(this.businessAdvice.values()).filter(
      (advice) => advice.mentorId === mentorId && advice.businessId === businessId
    );
  }
  
  async createBusinessAdvice(advice: InsertBusinessAdvice): Promise<BusinessAdvice> {
    const id = this.businessAdviceIdCounter++;
    const now = new Date();
    const newAdvice: BusinessAdvice = { 
      ...advice, 
      id, 
      createdAt: now,
      updatedAt: null
    };
    this.businessAdvice.set(id, newAdvice);
    return newAdvice;
  }
  
  async updateBusinessAdvice(id: number, adviceData: Partial<InsertBusinessAdvice>): Promise<BusinessAdvice | undefined> {
    const advice = await this.getBusinessAdviceById(id);
    if (!advice) return undefined;
    
    const now = new Date();
    const updatedAdvice = { ...advice, ...adviceData, updatedAt: now };
    this.businessAdvice.set(id, updatedAdvice);
    return updatedAdvice;
  }
  
  async deleteBusinessAdvice(id: number): Promise<void> {
    this.businessAdvice.delete(id);
  }
  
  // Seed initial mentors as per project requirements
  private seedMentors() {
    const mentorsData = [
      {
        id: this.mentorIdCounter++,
        userId: 0, // This will be updated when the user is created
        name: "Prof. Afia Frimpomaa Asare Marfo",
        phone: "0244723472",
        email: "afamarfo.pharm@knust.edu.gh",
        assignedDistrict: "Bekwai",
        specialization: "Prof. Afia Frimpomaa Asare Marfo is an Associate Professor of Pharmacy Practice at KNUST with over a decade of experience mentoring young women in clinical pharmacy and public health.",
        createdAt: new Date()
      },
      {
        id: this.mentorIdCounter++,
        userId: 0,
        name: "Dr. (Mrs) Matilda Kokui Owusu-Bio",
        phone: "0204 253 131",
        email: "mkobio.ksb@knust.edu.gh",
        assignedDistrict: "Gushegu",
        specialization: "Dr. Matilda Kokui Owusu-Bio is a lecturer and senior advisor at KNUST with expertise in logistics, digital education, and gender inclusion in supply chains.",
        createdAt: new Date()
      },
      {
        id: this.mentorIdCounter++,
        userId: 0,
        name: "Dr. Sheena Lovia Boateng",
        phone: "055 986 8938",
        email: "slboateng@ug.edu.gh",
        assignedDistrict: "Lower Manya Krobo, Ghana",
        specialization: "Dr. Sheena Lovia Boateng, a senior lecturer at the University of Ghana Business School, is a pioneer in digital entrepreneurship, women's empowerment, and academic mentorship.",
        createdAt: new Date()
      },
      {
        id: this.mentorIdCounter++,
        userId: 0,
        name: "Ms. Naomi Kokuro",
        phone: "0248864864",
        email: "naomikokuro@gmail.com",
        assignedDistrict: "Gushegu",
        specialization: "Ms. Naomi Kokuro is a marketing strategist and social entrepreneur with over 15 years of experience mentoring young women through entrepreneurship and digital skills training.",
        createdAt: new Date()
      },
      {
        id: this.mentorIdCounter++,
        userId: 0,
        name: "Joseph Budu",
        phone: "054 100 3884",
        email: "josbudu@gimpa.edu.gh",
        assignedDistrict: "Bekwai",
        specialization: "Head, GIMPA Hub for Teaching and Learning",
        createdAt: new Date()
      }
    ];
    
    mentorsData.forEach(mentor => {
      this.mentors.set(mentor.id, mentor as Mentor);
    });
  }
}

// Database implementation
export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any to avoid SessionStore type issues

  constructor() {
    // Initialize PostgreSQL session store for persistent sessions
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    // Seed initial data if needed
    this.seedMentorsIfNeeded();
    this.seedDefaultPermissions();
  }
  
  // Role and Permission Management for Database
  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }
  
  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role;
  }
  
  async getAllRoles(): Promise<Role[]> {
    // Use system roles table (roles) instead of custom_roles table
    try {
      console.log("Getting all roles from system roles table");
      return await db.select().from(roles).orderBy(roles.name);
    } catch (error) {
      console.error("Error fetching roles:", error);
      return [];
    }
  }
  
  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }
  
  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role | undefined> {
    const [updatedRole] = await db
      .update(roles)
      .set({
        ...roleData,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, id))
      .returning();
    return updatedRole;
  }
  
  async deleteRole(id: number): Promise<void> {
    // Get the role first to check for system roles
    const role = await this.getRoleById(id);
    if (!role) {
      throw new Error(`Role with ID ${id} not found`);
    }
    
    if (role.isSystem) {
      throw new Error(`Cannot delete system role: ${role.name}`);
    }
    
    // Delete the role - cascading delete will remove rolePermissions
    await db.delete(roles).where(eq(roles.id, id));
  }
  
  // Permission Management
  async getPermission(id: number): Promise<Permission | undefined> {
    const [permission] = await db.select().from(permissions).where(eq(permissions.id, id));
    return permission;
  }
  
  async getPermissionByResourceAction(resource: PermissionResource, action: PermissionAction): Promise<Permission | undefined> {
    const [permission] = await db
      .select()
      .from(permissions)
      .where(
        and(
          eq(permissions.resource, resource),
          eq(permissions.action, action)
        )
      );
    return permission;
  }
  
  async getAllPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions);
  }
  
  async getPermissionsByModule(module: string): Promise<Permission[]> {
    return await db
      .select()
      .from(permissions)
      .where(eq(permissions.module, module))
      .orderBy(permissions.resource, permissions.action);
  }
  
  async createPermission(permission: InsertPermission): Promise<Permission> {
    const [newPermission] = await db.insert(permissions).values(permission).returning();
    return newPermission;
  }
  
  async updatePermission(id: number, permData: Partial<InsertPermission>): Promise<Permission | undefined> {
    const [updatedPermission] = await db
      .update(permissions)
      .set({
        ...permData,
        updatedAt: new Date(),
      })
      .where(eq(permissions.id, id))
      .returning();
    return updatedPermission;
  }
  
  async deletePermission(id: number): Promise<void> {
    await db.delete(permissions).where(eq(permissions.id, id));
  }
  
  // Role Permission Junction Methods
  async getRolePermission(id: number): Promise<RolePermission | undefined> {
    const [rolePermission] = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.id, id));
    
    // Populate related resource and action properties
    if (rolePermission) {
      const [permission] = await db
        .select()
        .from(permissions)
        .where(eq(permissions.id, rolePermission.permissionId));
        
      const [role] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, rolePermission.roleId));
        
      return {
        ...rolePermission,
        role: role.name,
        resource: permission.resource,
        action: permission.action
      } as unknown as RolePermission;
    }
    
    return undefined;
  }
  
  async getRolePermissionsByRole(roleName: string): Promise<RolePermission[]> {
    // First get the role by name from custom_roles table
    const [role] = await db
      .select()
      .from(customRoles)
      .where(eq(customRoles.name, roleName));
      
    if (!role) {
      return [];
    }
    
    // Get the permissions directly from role_permissions table
    // since the schema has resource and action columns directly
    const results = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, role.id));
    
    return results;
  }
  
  async getAllRolePermissions(): Promise<RolePermission[]> {
    const results = await db
      .select({
        id: rolePermissions.id,
        roleId: rolePermissions.roleId,
        permissionId: rolePermissions.permissionId,
        createdAt: rolePermissions.createdAt,
        updatedAt: rolePermissions.updatedAt,
        role: roles.name,
        resource: permissions.resource,
        action: permissions.action
      })
      .from(rolePermissions)
      .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id));
    
    return results as unknown as RolePermission[];
  }
  
  async hasPermission(roleName: string, resourceName: string, actionName: string): Promise<boolean> {
    // Admin always has all permissions
    if (roleName.toLowerCase() === 'admin') return true;
    
    const [result] = await db
      .select({
        exists: sql<boolean>`EXISTS (
          SELECT 1 FROM ${rolePermissions}
          JOIN ${roles} ON ${rolePermissions.roleId} = ${roles.id}
          WHERE ${roles.name} = ${roleName}
          AND ${rolePermissions.resource} = ${resourceName}
          AND ${rolePermissions.action} = ${actionName}
        )`
      });
      
    return result.exists;
  }
  
  async checkRolePermissionExists(roleName: string, resourceName: string, actionName: string): Promise<RolePermission | undefined> {
    const [result] = await db
      .select({
        id: rolePermissions.id,
        roleId: rolePermissions.roleId,
        createdAt: rolePermissions.createdAt,
        updatedAt: rolePermissions.updatedAt,
        role: roles.name,
        resource: rolePermissions.resource,
        action: rolePermissions.action
      })
      .from(rolePermissions)
      .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
      .where(
        and(
          eq(roles.name, roleName),
          eq(rolePermissions.resource, resourceName),
          eq(rolePermissions.action, actionName)
        )
      );
    
    return result as unknown as RolePermission;
  }
  
  async createRolePermission(permission: InsertRolePermission): Promise<RolePermission> {
    // First get the role ID from system roles table
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, permission.role as string));
      
    if (!role) {
      throw new Error(`Role with name ${permission.role} not found`);
    }
    
    // Check if this role permission already exists
    const existingPermission = await this.checkRolePermissionExists(
      permission.role as string,
      permission.resource as string,
      permission.action as string
    );
    
    if (existingPermission) {
      return existingPermission;
    }
    
    // Create the role permission entry with direct resource and action (no join needed)
    const [newRolePermission] = await db.insert(rolePermissions)
      .values({
        roleId: role.id,
        resource: permission.resource as string,
        action: permission.action as string
      })
      .returning();
      
    // Return with the complete data
    return {
      ...newRolePermission,
      role: role.name
    } as unknown as RolePermission;
  }
  
  async deleteRolePermission(permission: InsertRolePermission): Promise<void> {
    // First get the role ID from system roles table
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, permission.role as string));
      
    if (!role) return; // Role not found, nothing to delete
    
    // Delete the role permission directly using resource and action
    await db.delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, role.id),
          eq(rolePermissions.resource, permission.resource as string),
          eq(rolePermissions.action, permission.action as string)
        )
      );
  }
  
  async deleteRolePermissionsByRole(roleName: string): Promise<void> {
    // This is the same as deleteAllRolePermissions
    await this.deleteAllRolePermissions(roleName);
  }
  
  async deleteAllRolePermissions(roleName: string): Promise<void> {
    // First get the role ID from system roles table
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, roleName));
      
    if (!role) return; // Role not found, nothing to delete
    
    // Delete all permissions for this role
    await db.delete(rolePermissions)
      .where(eq(rolePermissions.roleId, role.id));
  }
  
  // Helper method to seed default role permissions
  private async seedDefaultPermissions() {
    try {
      // Check if permissions table is empty
      const existingPermissions = await db.select({ count: sql<number>`count(*)` }).from(rolePermissions);
      
      if (existingPermissions[0].count === 0) {
        console.log("Seeding default role permissions...");
        
        // Define module structure with resources
        const modules = {
          userManagement: ["users", "roles", "permissions"],
          youthProfile: ["youth_profiles", "youth_education", "youth_certifications", "youth_skills"],
          business: ["businesses", "business_youth"],
          mentor: ["mentors", "mentor_assignments", "mentorship_messages", "business_advice"],
          admin: ["reports", "system_settings"]
        };
        
        const actions = ["view", "create", "edit", "delete", "manage"];
        const roles = ["admin", "reviewer", "mentor", "user", "manager"];
        
        // Define permission batches for bulk insert
        const defaultPermissions: InsertRolePermission[] = [];
        
        // Admin has all permissions across all modules
        Object.values(modules).flat().forEach(resource => {
          actions.forEach(action => {
            defaultPermissions.push({
              role: "admin",
              resource: resource as PermissionResource,
              action: action as PermissionAction,
            });
          });
        });
        
        // Mentor permissions - view all profiles, businesses; edit advice
        const mentorViewResources = [
          ...modules.youthProfile,
          ...modules.business,
          ...modules.mentor
        ];
        
        const mentorEditResources = [
          "mentorship_messages",
          "business_advice"
        ];
        
        mentorViewResources.forEach(resource => {
          defaultPermissions.push({
            role: "mentor",
            resource: resource as PermissionResource,
            action: "view"
          });
        });
        
        mentorEditResources.forEach(resource => {
          defaultPermissions.push({
            role: "mentor",
            resource: resource as PermissionResource,
            action: "edit"
          });
          
          // Mentors can also create messages and advice
          if (resource === "mentorship_messages" || resource === "business_advice") {
            defaultPermissions.push({
              role: "mentor",
              resource: resource as PermissionResource,
              action: "create"
            });
          }
        });
        
        // Reviewer permissions - view reports
        const reviewerResources = [
          ...modules.business,
          ...modules.youthProfile,
          "reports"
        ];
        
        reviewerResources.forEach(resource => {
          defaultPermissions.push({
            role: "reviewer",
            resource: resource as PermissionResource,
            action: "view"
          });
        });
        
        // Additional permissions for reviewer role
        
        defaultPermissions.push({
          role: "reviewer",
          resource: "reports",
          action: "create"
        });
        
        // Manager permissions - broader access than mentors but less than admin
        const managerViewResources = [
          ...modules.userManagement,
          ...modules.youthProfile,
          ...modules.business,
          ...modules.mentor,
          "reports"
        ];
        
        const managerEditResources = [
          ...modules.youthProfile,
          ...modules.business,
          "mentors",
          "mentor_assignments",
          "reports"
        ];
        
        managerViewResources.forEach(resource => {
          defaultPermissions.push({
            role: "manager",
            resource: resource as PermissionResource,
            action: "view"
          });
        });
        
        managerEditResources.forEach(resource => {
          defaultPermissions.push({
            role: "manager",
            resource: resource as PermissionResource,
            action: "edit"
          });
          defaultPermissions.push({
            role: "manager",
            resource: resource as PermissionResource,
            action: "create"
          });
        });
        
        // Batch insert permissions
        if (defaultPermissions.length > 0) {
          await db.insert(rolePermissions).values(defaultPermissions);
          console.log(`Seeded ${defaultPermissions.length} default role permissions.`);
        }
      } else {
        console.log(`Found ${existingPermissions[0].count} existing permissions, skipping permission seeding.`);
      }
    } catch (error) {
      console.error("Error seeding default permissions:", error);
    }
  }
  
  // User Management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    try {
      console.log(`Updating user ${id} with data:`, JSON.stringify(userData, null, 2));
      
      // First check if user exists
      const user = await this.getUser(id);
      if (!user) {
        console.error(`User with ID ${id} not found for update`);
        return undefined;
      }
      
      // Perform the update
      const [updatedUser] = await db
        .update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      
      console.log(`Update successful for user ${id}:`, JSON.stringify(updatedUser, null, 2));
      return updatedUser;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error; // Re-throw to be handled by the caller
    }
  }
  
  async getAllUsers(page?: number, limit?: number): Promise<{ users: User[]; total: number }> {
    // Default to page 1 and 10 users per page if not specified
    const pageNum = page || 1;
    const pageSize = limit || 10;
    const offset = (pageNum - 1) * pageSize;
    
    // Get the total count of users
    const [{ count }] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(users);
    
    // Get paginated users
    const usersList = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset(offset);
    
    return {
      users: usersList,
      total: count
    };
  }
  
  async deleteUser(id: number): Promise<void> {
    // First, check if this user is associated with any mentors
    const [mentor] = await db.select().from(mentors).where(eq(mentors.userId, id));
    
    if (mentor) {
      // If the user is a mentor, first delete the mentor data
      await db.delete(mentors).where(eq(mentors.userId, id));
      
      // Also remove any mentor-business relationships
      await db.delete(mentorBusinessRelationships).where(eq(mentorBusinessRelationships.mentorId, mentor.id));
    }
    
    // Then delete the user
    await db.delete(users).where(eq(users.id, id));
  }
  
  // Youth Profiles
  async getYouthProfile(id: number): Promise<YouthProfile | undefined> {
    const [profile] = await db.select().from(youthProfiles).where(eq(youthProfiles.id, id));
    return profile;
  }
  
  async getYouthProfileByParticipantCode(code: string): Promise<YouthProfile | undefined> {
    if (!code) return undefined;
    const [profile] = await db.select().from(youthProfiles).where(eq(youthProfiles.participantCode, code));
    return profile;
  }
  
  async getYouthProfileByUserId(userId: number): Promise<YouthProfile | undefined> {
    const [profile] = await db.select().from(youthProfiles).where(eq(youthProfiles.userId, userId));
    return profile;
  }
  
  async getYouthProfilesByDistrict(district: string): Promise<YouthProfile[]> {
    // Using SQL template to avoid type issues with enums
    return db.select().from(youthProfiles).where(sql`${youthProfiles.district} = ${district}`);
  }
  
  async getAllYouthProfiles(): Promise<YouthProfile[]> {
    return db.select().from(youthProfiles);
  }
  
  async createYouthProfile(profile: InsertYouthProfileSchema): Promise<YouthProfile> {
    const [newProfile] = await db.insert(youthProfiles).values(profile).returning();
    return newProfile;
  }
  
  async updateYouthProfile(id: number, profileData: Partial<InsertYouthProfileSchema>): Promise<YouthProfile | undefined> {
    // Set the updatedAt timestamp
    const dataWithTimestamp = {
      ...profileData,
      updatedAt: new Date(),
    };
    
    // Debugging for guarantor field
    if ('guarantor' in profileData) {
      console.log(`Storage: Updating guarantor field for profile ${id} to: "${profileData.guarantor}"`);
      
      // Handle empty string case explicitly
      if (profileData.guarantor === '') {
        console.log(`Storage: Empty guarantor string detected - ensuring it's properly sent as empty string`);
      }
    }
    
    const [updatedProfile] = await db
      .update(youthProfiles)
      .set(dataWithTimestamp)
      .where(eq(youthProfiles.id, id))
      .returning();
    
    return updatedProfile;
  }
  
  async deleteYouthProfile(id: number): Promise<void> {
    // First check if the profile exists
    const profile = await this.getYouthProfile(id);
    if (!profile) {
      throw new Error(`Youth profile with ID ${id} not found`);
    }
    
    console.log(`Deleting youth profile with ID ${id}`);
    
    // Delete the profile
    await db.delete(youthProfiles).where(eq(youthProfiles.id, id));
  }
  
  // Youth Skills Methods
  async addSkillToYouthProfile(youthId: number, skillId: number): Promise<void> {
    // Check if the association already exists
    const existingAssociation = await db.select()
      .from(youthSkills)
      .where(
        and(
          eq(youthSkills.youthId, youthId),
          eq(youthSkills.skillId, skillId)
        )
      );
    
    // If it doesn't exist, create it
    if (existingAssociation.length === 0) {
      await db.insert(youthSkills).values({
        youthId,
        skillId,
        proficiencyLevel: 'Beginner', // Default level for imported skills
        createdAt: new Date()
      });
      console.log(`Added skill ${skillId} to youth profile ${youthId}`);
    } else {
      console.log(`Skill ${skillId} already exists for youth profile ${youthId}`);
    }
  }
  

  
  // Business Profiles Methods
  async getBusinessProfile(id: number): Promise<BusinessProfile | undefined> {
    const [profile] = await db.select().from(businessProfiles).where(eq(businessProfiles.id, id));
    return profile;
  }
  
  async getBusinessProfileByName(name: string): Promise<BusinessProfile | undefined> {
    const [profile] = await db.select().from(businessProfiles).where(eq(businessProfiles.businessName, name));
    return profile;
  }
  
  async getBusinessProfilesByDistrict(district: string): Promise<BusinessProfile[]> {
    return db.select().from(businessProfiles).where(sql`${businessProfiles.district} = ${district}`);
  }
  
  async getAllBusinessProfiles(): Promise<BusinessProfile[]> {
    return db.select().from(businessProfiles);
  }
  
  async createBusinessProfile(profile: InsertBusinessProfile): Promise<BusinessProfile> {
    const [newProfile] = await db.insert(businessProfiles).values(profile).returning();
    return newProfile;
  }
  
  async updateBusinessProfile(id: number, profileData: Partial<InsertBusinessProfile>): Promise<BusinessProfile | undefined> {
    // Set the updatedAt timestamp
    const dataWithTimestamp = {
      ...profileData,
      updatedAt: new Date(),
    };
    
    const [updatedProfile] = await db
      .update(businessProfiles)
      .set(dataWithTimestamp)
      .where(eq(businessProfiles.id, id))
      .returning();
    
    return updatedProfile;
  }
  
  // Business-Youth Relationship Methods
  async getBusinessYouthRelationships(businessId: number): Promise<BusinessYouthRelationship[]> {
    return db.select()
      .from(businessYouthRelationships)
      .where(eq(businessYouthRelationships.businessId, businessId));
  }
  
  async getYouthBusinesses(youthId: number): Promise<BusinessProfile[]> {
    try {
      // Get all business IDs this youth is part of
      const relationships = await db.select()
        .from(businessYouthRelationships)
        .where(eq(businessYouthRelationships.youthId, youthId));

      if (relationships.length === 0) {
        return [];
      }

      // Get all business profiles for these IDs
      const businessIds = relationships.map(rel => rel.businessId);
      if (businessIds.length === 0) {
        return [];
      }

      // Use inArray to safely handle the IN clause
      const businesses = await db.select()
        .from(businessProfiles)
        .where(inArray(businessProfiles.id, businessIds));

      return businesses;
    } catch (error) {
      console.error(`Error fetching businesses for youthId ${youthId}:`, error);
      throw error;
    }
  }
  async getYouthBusinessesByIds(youthIds: number[]): Promise<any[]> {
    const query = `
      SELECT *
      FROM businesses
      WHERE youth_id = ANY($1);
    `;
    const values = [youthIds];
    const result = await this.pool.query(query, values);
    return result.rows;
  }
  async getAllYouthBusinessRelationships(): Promise<Record<number, BusinessProfile[]>> {
    // Get all youth-business relationships
    const allRelationships = await db.select().from(businessYouthRelationships);
    
    // Group by youth ID
    const youthToBusinessMap: Record<number, number[]> = {};
    allRelationships.forEach(rel => {
      if (!youthToBusinessMap[rel.youthId]) {
        youthToBusinessMap[rel.youthId] = [];
      }
      youthToBusinessMap[rel.youthId].push(rel.businessId);
    });
    
    // Get all business profiles to avoid multiple queries
    const allBusinesses = await db.select().from(businessProfiles);
    const businessMap = new Map<number, BusinessProfile>();
    allBusinesses.forEach(business => {
      businessMap.set(business.id, business);
    });
    
    // Build final map of youth IDs to business profiles
    const result: Record<number, BusinessProfile[]> = {};
    for (const [youthId, businessIds] of Object.entries(youthToBusinessMap)) {
      result[Number(youthId)] = businessIds.map(id => businessMap.get(id)!).filter(Boolean);
    }
    
    return result;
  }
  
  async addYouthToBusiness(relation: InsertBusinessYouthRelationship): Promise<BusinessYouthRelationship> {
    const [newRelation] = await db.insert(businessYouthRelationships)
      .values(relation)
      .returning();
    return newRelation;
  }
  
  async removeYouthFromBusiness(businessId: number, youthId: number): Promise<void> {
    await db.delete(businessYouthRelationships)
      .where(
        and(
          eq(businessYouthRelationships.businessId, businessId),
          eq(businessYouthRelationships.youthId, youthId)
        )
      );
  }
  
  async updateYouthBusinessRole(businessId: number, youthId: number, role: string): Promise<BusinessYouthRelationship | undefined> {
    const [updatedRelation] = await db.update(businessYouthRelationships)
      .set({ role })
      .where(
        and(
          eq(businessYouthRelationships.businessId, businessId),
          eq(businessYouthRelationships.youthId, youthId)
        )
      )
      .returning();
    
    return updatedRelation;
  }
  

  
  // Mentors
  async getMentor(id: number): Promise<Mentor | undefined> {
    const [mentor] = await db.select().from(mentors).where(eq(mentors.id, id));
    return mentor;
  }
  
  async getMentorByUserId(userId: number): Promise<Mentor | undefined> {
    const [mentor] = await db.select().from(mentors).where(eq(mentors.userId, userId));
    return mentor;
  }
  
  async getMentorsByDistrict(district: string): Promise<Mentor[]> {
    // Using SQL template to avoid type issues with enums
    return db.select().from(mentors).where(sql`${mentors.assignedDistrict} = ${district}`);
  }
  
  async getAllMentors(): Promise<Mentor[]> {
    return db.select().from(mentors);
  }
  
  async createMentor(mentor: InsertMentor): Promise<Mentor> {
    const [newMentor] = await db.insert(mentors).values(mentor).returning();
    return newMentor;
  }
  
  async updateMentor(id: number, mentorData: Partial<InsertMentor>): Promise<Mentor | undefined> {
    try {
      console.log(`Updating mentor ${id} with data:`, JSON.stringify(mentorData, null, 2));
      
      // First, ensure the mentor exists
      const existingMentor = await this.getMentor(id);
      if (!existingMentor) {
        console.error(`Mentor with ID ${id} not found for update`);
        return undefined;
      }
      
      // Perform the update
      const [updatedMentor] = await db
        .update(mentors)
        .set(mentorData)
        .where(eq(mentors.id, id))
        .returning();
      
      console.log(`Update successful for mentor ${id}:`, JSON.stringify(updatedMentor, null, 2));
      return updatedMentor;
    } catch (error) {
      console.error(`Error updating mentor ${id}:`, error);
      throw error; // Re-throw to be handled by the caller
    }
  }
  
  async deleteMentor(id: number): Promise<boolean> {
    try {
      await db.delete(mentors)
        .where(eq(mentors.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting mentor:", error);
      return false;
    }
  }
  
  // Mentorship Messages
  async getMentorshipMessage(id: number): Promise<MentorshipMessage | undefined> {
    const [message] = await db.select().from(mentorshipMessages).where(eq(mentorshipMessages.id, id));
    return message;
  }
  
  async getMentorshipMessagesByMentorId(mentorId: number): Promise<MentorshipMessage[]> {
    return db.select().from(mentorshipMessages).where(eq(mentorshipMessages.mentorId, mentorId));
  }
  
  async getMentorshipMessagesByBusinessId(businessId: number): Promise<MentorshipMessage[]> {
    // The schema has been updated to use businessId directly
    return db.select().from(mentorshipMessages).where(eq(mentorshipMessages.businessId, businessId));
  }
  
  async getMentorshipMessagesByMentorAndBusiness(mentorId: number, businessId: number): Promise<MentorshipMessage[]> {
    // Using SQL template for explicit query to avoid type issues
    return db
      .select()
      .from(mentorshipMessages)
      .where(sql`${mentorshipMessages.mentorId} = ${mentorId} AND ${mentorshipMessages.businessId} = ${businessId}`);
  }
  
  async createMentorshipMessage(message: InsertMentorshipMessage): Promise<MentorshipMessage> {
    // Insert message directly with the businessId field
    const [newMessage] = await db.insert(mentorshipMessages).values(message).returning();
    return newMessage;
  }
  
  // Mentor-Business Relationship Methods
  async getMentorBusinessRelationship(mentorId: number, businessId: number): Promise<MentorBusinessRelationship | undefined> {
    const [relationship] = await db.select()
      .from(mentorBusinessRelationships)
      .where(
        and(
          eq(mentorBusinessRelationships.mentorId, mentorId),
          eq(mentorBusinessRelationships.businessId, businessId)
        )
      );
    
    return relationship;
  }
  
  async getMentorBusinessRelationshipsByMentor(mentorId: number): Promise<MentorBusinessRelationship[]> {
    return db.select()
      .from(mentorBusinessRelationships)
      .where(eq(mentorBusinessRelationships.mentorId, mentorId));
  }
  
  async getBusinessesForMentor(mentorId: number): Promise<BusinessProfile[]> {
    const relationships = await db.select({
      businessId: mentorBusinessRelationships.businessId
    }).from(mentorBusinessRelationships)
      .where(eq(mentorBusinessRelationships.mentorId, mentorId));
    
    if (relationships.length === 0) {
      return [];
    }
    
    const businessIds = relationships.map(rel => rel.businessId);
    
    return db.select()
      .from(businessProfiles)
      .where(inArray(businessProfiles.id, businessIds));
  }
  
  /**
 * Get a mentor-business relationship by ID
 * @param id The ID of the relationship
 * @returns Promise<MentorBusinessRelationship | undefined>
 */
async getMentorBusinessRelationshipById(id: number): Promise<MentorBusinessRelationship | undefined> {
  try {
    console.log(`Getting mentor-business relationship with ID ${id}`);
    const [relationship] = await db.select()
      .from(mentorBusinessRelationships)
      .where(eq(mentorBusinessRelationships.id, id));
    
    return relationship;
  } catch (error) {
    console.error(`Error getting mentor-business relationship with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get detailed mentor-business relationships with mentor and business info
 * @returns Promise<Array<any>>
 */
async getDetailedMentorBusinessRelationships(): Promise<Array<any>> {
  try {
    console.log('Getting detailed mentor-business relationships');
    
    // First get all mentor-business relationships
    const relationships = await db.select().from(mentorBusinessRelationships);
    
    console.log(`Found ${relationships.length} mentor-business relationships`);
    
    // If there are no relationships, return empty array
    if (relationships.length === 0) {
      console.log('No mentor-business relationships found');
      return [];
    }
    
    // Create an enhanced array with detailed information
    const detailedRelationships = [];
    
    for (const rel of relationships) {
      try {
        console.log(`Processing relationship: mentorId=${rel.mentorId}, businessId=${rel.businessId}`);
        
        // Get mentor data
        const [mentor] = await db.select().from(mentors).where(eq(mentors.id, rel.mentorId));
        
        if (!mentor) {
          console.log(`Mentor with ID ${rel.mentorId} not found, skipping relationship`);
          continue;
        }
        
        // Get business data
        const [business] = await db.select().from(businessProfiles).where(eq(businessProfiles.id, rel.businessId));
        
        if (!business) {
          console.log(`Business with ID ${rel.businessId} not found, skipping relationship`);
          continue;
        }
        
        console.log(`Found mentor: ${mentor.name}, business: ${business.businessName}`);
        
        // Create the detailed relationship object with proper format
        detailedRelationships.push({
          id: rel.id,
          mentorId: rel.mentorId,
          businessId: rel.businessId,
          assignedDate: rel.assignedDate,
          isActive: rel.isActive,
          mentorshipFocus: rel.mentorshipFocus,
          mentorshipGoals: rel.mentorshipGoals,
          meetingFrequency: rel.meetingFrequency,
          nextMeetingDate: rel.nextMeetingDate,
          lastMeetingDate: rel.lastMeetingDate,
          mentorshipProgress: rel.mentorshipProgress,
          progressRating: rel.progressRating,
          createdAt: rel.createdAt,
          updatedAt: rel.updatedAt,
          mentor: {
            id: mentor.id,
            fullName: mentor.name || "Unknown",
            profilePicture: mentor.profilePicture
          },
          business: {
            id: business.id,
            businessName: business.businessName || "Unknown",
            district: business.district
          }
        });
      } catch (err) {
        console.error(`Error processing relationship mentorId=${rel.mentorId}, businessId=${rel.businessId}:`, err);
        // Continue to next relationship instead of failing the whole operation
      }
    }
    
    console.log(`Successfully processed ${detailedRelationships.length} detailed mentor-business relationships`);
    return detailedRelationships;
  } catch (error) {
    console.error('Error getting detailed mentor-business relationships:', error);
    // Return empty array instead of throwing error
    return [];
  }
}
/**
 * Delete a mentor-business relationship by ID
 * @param id The ID of the relationship to delete
 * @returns Promise<boolean> True if successfully deleted, false otherwise
 */
async deleteMentorBusinessRelationship(id: number): Promise<boolean> {
  try {
    console.log(`Deleting mentor-business relationship with ID ${id}`);
    const result = await db.delete(mentorBusinessRelationships)
      .where(eq(mentorBusinessRelationships.id, id))
      .returning();
    
    return result.length > 0;
  } catch (error) {
    console.error(`Error deleting mentor-business relationship with ID ${id}:`, error);
    throw error;
  }
}

  async getMentorsForBusiness(businessId: number): Promise<Mentor[]> {
    const relationships = await db.select({
      mentorId: mentorBusinessRelationships.mentorId
    }).from(mentorBusinessRelationships)
      .where(eq(mentorBusinessRelationships.businessId, businessId));
    
    if (relationships.length === 0) {
      return [];
    }
    
    const mentorIds = relationships.map(rel => rel.mentorId);
    
    return db.select()
      .from(mentors)
      .where(inArray(mentors.id, mentorIds));
  }
  
  async getAllMentorBusinessRelationships(): Promise<MentorBusinessRelationship[]> {
    return db.select().from(mentorBusinessRelationships);
  }
  
  async addMentorToBusiness(relation: InsertMentorBusinessRelationship): Promise<MentorBusinessRelationship> {
    // Handle case where assignedDate might be missing and ensure date is in ISO string format
    let assignedDate = relation.assignedDate;
    
    // Convert Date object to ISO string if necessary
    if (!assignedDate) {
      assignedDate = new Date().toISOString().split('T')[0];
    } else if (assignedDate instanceof Date) {
      assignedDate = assignedDate.toISOString().split('T')[0];
    }
    
    const relationToInsert = { 
      ...relation, 
      assignedDate
    };
    
    const [relationship] = await db
      .insert(mentorBusinessRelationships)
      .values(relationToInsert)
      .returning();
    
    return relationship;
  }
  
  async removeMentorFromBusiness(mentorId: number, businessId: number): Promise<void> {
  try {
    await db.delete(mentorBusinessRelationships)
      .where(
        and(
          eq(mentorBusinessRelationships.mentorId, mentorId),
          eq(mentorBusinessRelationships.businessId, businessId)
        )
      );
  } catch (error) {
    // Fallback to raw SQL if ORM approach fails
    await db.execute(`
      DELETE FROM mentor_business_relationships 
      WHERE mentor_id = $1 AND business_id = $2
    `, [mentorId, businessId]);
  }
}

async removeMentorBusinessDirect(mentorId: number, businessId: number): Promise<boolean> {
  try {
    // Use direct SQL approach which we know works
    const result = await db.execute(`
      DELETE FROM mentor_business_relationships 
      WHERE mentor_id = $1 AND business_id = $2
    `, [mentorId, businessId]);
    
    return true;
  } catch (error) {
    console.error(`SQL error removing mentor ${mentorId} from business ${businessId}:`, error);
    throw error;
  }
}
  
  async updateMentorBusinessRelationship(mentorId: number, businessId: number, data: Partial<InsertMentorBusinessRelationship>): Promise<MentorBusinessRelationship | undefined> {
    const [updatedRelationship] = await db
      .update(mentorBusinessRelationships)
      .set(data)
      .where(
        and(
          eq(mentorBusinessRelationships.mentorId, mentorId),
          eq(mentorBusinessRelationships.businessId, businessId)
        )
      )
      .returning();
    
    return updatedRelationship;
  }
  
  async clearAllMentorBusinessRelationships(): Promise<void> {
    await db.delete(mentorBusinessRelationships);
  }

  // Business Advice Methods
  async getAllBusinessAdvice(): Promise<BusinessAdvice[]> {
    return db.select().from(businessAdvice);
  }
  
  async getBusinessAdviceById(id: number): Promise<BusinessAdvice | undefined> {
    const [advice] = await db.select().from(businessAdvice).where(eq(businessAdvice.id, id));
    return advice;
  }
  
  async getBusinessAdviceByBusinessId(businessId: number): Promise<BusinessAdvice[]> {
    return db.select().from(businessAdvice).where(eq(businessAdvice.businessId, businessId));
  }
  
  async getBusinessAdviceByMentorId(mentorId: number): Promise<BusinessAdvice[]> {
    return db.select().from(businessAdvice).where(eq(businessAdvice.mentorId, mentorId));
  }
  
  async getBusinessAdviceByMentorAndBusiness(mentorId: number, businessId: number): Promise<BusinessAdvice[]> {
    return db.select().from(businessAdvice).where(
      and(
        eq(businessAdvice.mentorId, mentorId),
        eq(businessAdvice.businessId, businessId)
      )
    );
  }
  
  async createBusinessAdvice(advice: InsertBusinessAdvice): Promise<BusinessAdvice> {
    const [newAdvice] = await db.insert(businessAdvice).values(advice).returning();
    return newAdvice;
  }
  
  async updateBusinessAdvice(id: number, adviceData: Partial<InsertBusinessAdvice>): Promise<BusinessAdvice | undefined> {
    // Add updatedAt timestamp
    const dataWithTimestamp = {
      ...adviceData,
      updatedAt: new Date(),
    };
    
    const [updatedAdvice] = await db
      .update(businessAdvice)
      .set(dataWithTimestamp)
      .where(eq(businessAdvice.id, id))
      .returning();
    
    return updatedAdvice;
  }
  
  async deleteBusinessAdvice(id: number): Promise<void> {
    await db.delete(businessAdvice).where(eq(businessAdvice.id, id));
  }
  
  // Business Tracking Methods
  async getBusinessTracking(id: number): Promise<any | undefined> {
    // Use a raw SQL query with the actual column names from the database
    const result = await db.execute(sql`
      SELECT 
        id, 
        business_id, 
        mentor_id, 
        profile_id,
        month, 
        year, 
        revenue as actual_revenue, 
        expenses,
        profit,
        customer_count,
        employee_count as actual_employees, 
        created_at, 
        updated_at,
        is_verified,
        verified_by,
        verification_date,
        recorded_by,
        notes
      FROM business_tracking
      WHERE id = ${id}
    `);
    
    return result.rows[0] || undefined;
  }
  
  async getAllBusinessTrackings(): Promise<any[]> {
    // Use a raw SQL query with the actual column names from the database
    const result = await db.execute(sql`
      SELECT 
        id, 
        business_id, 
        mentor_id, 
        profile_id,
        month, 
        year, 
        revenue as actual_revenue, 
        expenses,
        profit,
        customer_count,
        employee_count as actual_employees, 
        created_at, 
        updated_at,
        is_verified,
        verified_by,
        verification_date,
        recorded_by
      FROM business_tracking
      ORDER BY created_at DESC, id DESC
    `);
    return result.rows;
  }

  async getBusinessTrackingsByBusinessId(businessId: number): Promise<any[]> {
    // Use a raw SQL query with the actual column names from the database
    const result = await db.execute(sql`
      SELECT 
        id, 
        business_id, 
        mentor_id, 
        profile_id,
        tracking_month, 
        year, 
        revenue as actual_revenue, 
        expenses,
        profit,
        customer_count,
        employee_count as actual_employees, 
        created_at, 
        updated_at,
        is_verified,
        verified_by,
        verification_date,
        recorded_by,
        notes
      FROM business_tracking
      WHERE business_id = ${businessId}
      ORDER BY created_at DESC, id DESC
    `);
    return result.rows;
  }
  
  async getBusinessTrackingsByMentorId(mentorId: number): Promise<any[]> {
    // Use a raw SQL query with the actual column names from the database
    const result = await db.execute(sql`
      SELECT 
        id, 
        business_id, 
        mentor_id, 
        profile_id,
        month, 
        year, 
        revenue as actual_revenue, 
        expenses,
        profit,
        customer_count,
        employee_count as actual_employees, 
        created_at, 
        updated_at,
        is_verified,
        verified_by,
        verification_date,
        recorded_by,
        notes
      FROM business_tracking
      WHERE mentor_id = ${mentorId}
      ORDER BY created_at DESC, id DESC
    `);
    return result.rows;
  }
  
  async createBusinessTracking(tracking: InsertBusinessTracking): Promise<BusinessTracking> {
    const [newTracking] = await db.insert(businessTracking).values(tracking).returning();
    return newTracking;
  }
  
  async updateBusinessTracking(id: number, data: Partial<InsertBusinessTracking>): Promise<BusinessTracking | undefined> {
    const [updatedTracking] = await db
      .update(businessTracking)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(businessTracking.id, id))
      .returning();
      
    return updatedTracking;
  }
  
  async deleteBusinessTracking(id: number): Promise<void> {
    // Delete the tracking record directly
    // We skip attachment handling since we don't need it for this application
    await db.delete(businessTracking).where(eq(businessTracking.id, id));
  }
  
  async verifyBusinessTracking(id: number, verifiedBy: number): Promise<BusinessTracking | undefined> {
    const [verifiedTracking] = await db
      .update(businessTracking)
      .set({
        isVerified: true,
        verifiedBy,
        verificationDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(businessTracking.id, id))
      .returning();
      
    return verifiedTracking;
  }
  
  // Business Tracking Attachments Methods
  async getBusinessTrackingAttachment(id: number): Promise<BusinessTrackingAttachment | undefined> {
    const [attachment] = await db.select().from(businessTrackingAttachments).where(eq(businessTrackingAttachments.id, id));
    return attachment;
  }
  
  async getBusinessTrackingAttachmentsByTrackingId(trackingId: number): Promise<BusinessTrackingAttachment[]> {
    return db.select().from(businessTrackingAttachments).where(eq(businessTrackingAttachments.trackingId, trackingId));
  }
  
  async createBusinessTrackingAttachment(attachment: InsertBusinessTrackingAttachment): Promise<BusinessTrackingAttachment> {
    const [newAttachment] = await db.insert(businessTrackingAttachments).values(attachment).returning();
    return newAttachment;
  }
  
  async deleteBusinessTrackingAttachment(id: number): Promise<void> {
    await db.delete(businessTrackingAttachments).where(eq(businessTrackingAttachments.id, id));
  }
  
  // Seed initial data if needed
  private async seedMentorsIfNeeded() {
    try {
      // Check if mentors table is empty
      const existingMentors = await db.select({ count: sql<number>`count(*)` }).from(mentors);
      
      if (existingMentors[0].count === 0) {
        // Create a few mentors for testing
        const seedMentors: Partial<InsertMentor>[] = [
          {
            userId: 0, // Placeholder for now
            name: "Prof. Afia Frimpomaa Asare Marfo",
            email: "afamarfo.pharm@knust.edu.gh",
            phone: "+233 244723472",
            assignedDistrict: "Bekwai",
            specialization: "Pharmacy Practice and Leadership",
            bio: "Prof. Afia Frimpomaa Asare Marfo is an Associate Professor of Pharmacy Practice at KNUST with over a decade of experience mentoring young women in clinical pharmacy and public health.",
            isActive: true
          },
          {
            userId: 0,
            name: "Dr. Matilda Kokui Owusu-Bio",
            email: "mkobio.ksb@knust.edu.gh",
            phone: "+233 204 253 131",
            assignedDistrict: "Gushegu",
            specialization: "Logistics and Supply Chain",
            bio: "Dr. Matilda Kokui Owusu-Bio is a lecturer and senior advisor at KNUST with expertise in logistics, digital education, and gender inclusion in supply chains.",
            isActive: true
          },
          {
            userId: 0,
            name: "Dr. Sheena Lovia Boateng",
            email: "slboateng@ug.edu.gh",
            phone: "+233 55 986 8938",
            assignedDistrict: "Lower Manya Krobo",
            specialization: "Digital Entrepreneurship",
            bio: "Dr. Sheena Lovia Boateng, a senior lecturer at the University of Ghana Business School, is a pioneer in digital entrepreneurship, women's empowerment, and academic mentorship.",
            isActive: true
          },
          {
            userId: 0,
            name: "Ms. Naomi Kokuro",
            email: "naomikokuro@gmail.com",
            phone: "+233 248864864",
            assignedDistrict: "Gushegu",
            specialization: "Marketing and Social Entrepreneurship",
            bio: "Ms. Naomi Kokuro is a marketing strategist and social entrepreneur with over 15 years of experience mentoring young women through entrepreneurship and digital skills training.",
            isActive: true
          },
          {
            userId: 0,
            name: "Joseph Budu",
            email: "josbudu@gimpa.edu.gh",
            phone: "+233 54 100 3884",
            assignedDistrict: "Bekwai",
            specialization: "Teaching and Learning",
            bio: "Head, GIMPA Hub for Teaching and Learning",
            isActive: true
          }
        ];
        
        // Insert seed mentors into the database
        await db.insert(mentors).values(seedMentors);
        
        // Assign mentors to businesses after they're created
        await this.assignMentorsToBusinesses();
      }
    } catch (error) {
      console.error("Error seeding mentors:", error);
    }
  }
  
  // Helper method to assign mentors to businesses
  private async assignMentorsToBusinesses() {
    try {
      // Get all mentors and businesses
      const allMentors = await this.getAllMentors();
      const allBusinesses = await this.getAllBusinessProfiles();
      
      if (allMentors.length === 0 || allBusinesses.length === 0) {
        console.log("No mentors or businesses available for assignment");
        return;
      }
      
      // Clear existing relationships if there are any
      await this.clearAllMentorBusinessRelationships();
      
      // Track assignments per mentor
      const mentorAssignments = new Map<number, number>();
      allMentors.forEach(mentor => mentorAssignments.set(mentor.id, 0));
      
      // Format today's date as ISO string (YYYY-MM-DD)
      const todayFormatted = new Date().toISOString().split('T')[0];
      
      // First pass: assign businesses to mentors in the same district
      for (const business of allBusinesses) {
        // Find mentors in the same district with less than 2 assignments
        // Convert assignedDistrict to match the business.district format
        const districtMentors = allMentors.filter(mentor => {
          // Use the district directly as we've already normalized it
          const mentorDistrict = mentor.assignedDistrict;
          return mentorDistrict === business.district && 
            (mentorAssignments.get(mentor.id) || 0) < 2;
        });
        
        if (districtMentors.length > 0) {
          // Select mentor with fewest assignments
          const selectedMentor = districtMentors.reduce((a, b) => 
            (mentorAssignments.get(a.id) || 0) <= (mentorAssignments.get(b.id) || 0) ? a : b
          );
          
          // Create assignment
          await this.addMentorToBusiness({
            mentorId: selectedMentor.id,
            businessId: business.id,
            assignedDate: todayFormatted,
            isActive: true
          });
          
          // Update assignment count
          mentorAssignments.set(selectedMentor.id, (mentorAssignments.get(selectedMentor.id) || 0) + 1);
          console.log(`Assigned mentor ${selectedMentor.name} to business ${business.businessName}`);
        }
      }
      
      // Second pass: assign any remaining businesses to mentors with less than 2 assignments
      for (const business of allBusinesses) {
        // Check if business already has a mentor
        const businessMentors = await this.getMentorsForBusiness(business.id);
        if (businessMentors.length > 0) {
          continue;
        }
        
        // Find available mentors with less than 2 assignments
        const availableMentors = allMentors.filter(mentor => 
          (mentorAssignments.get(mentor.id) || 0) < 2
        );
        
        if (availableMentors.length > 0) {
          // Select mentor with fewest assignments
          const selectedMentor = availableMentors.reduce((a, b) => 
            (mentorAssignments.get(a.id) || 0) <= (mentorAssignments.get(b.id) || 0) ? a : b
          );
          
          // Create assignment
          await this.addMentorToBusiness({
            mentorId: selectedMentor.id,
            businessId: business.id,
            assignedDate: todayFormatted,
            isActive: true
          });
          
          // Update assignment count
          mentorAssignments.set(selectedMentor.id, (mentorAssignments.get(selectedMentor.id) || 0) + 1);
          console.log(`Assigned mentor ${selectedMentor.name} to business ${business.businessName} (second pass)`);
        }
      }
      
      // Log assignment summary
      console.log("Mentor-business assignments completed:");
      for (const mentor of allMentors) {
        console.log(`- ${mentor.name}: ${mentorAssignments.get(mentor.id) || 0} businesses assigned`);
      }
    } catch (error) {
      console.error("Error assigning mentors to businesses:", error);
    }
  }
  
  // Role Permission Methods
  async getRolePermission(id: number): Promise<RolePermission | undefined> {
    const [permission] = await db.select().from(rolePermissions).where(eq(rolePermissions.id, id));
    return permission;
  }
  
  async getRolePermissionsByRole(roleName: string): Promise<RolePermission[]> {
    try {
      console.log(`Getting permissions for role: ${roleName}`);
      
      // Admin special case - return all possible permissions
      if (roleName.toLowerCase() === 'admin') {
        // Get all possible resources and actions from the permissions table
        const allPermissions = await db.select().from(permissions);
        
        console.log(`Admin role - returning all ${allPermissions.length} permissions`);
        
        // Format them as role permissions
        return allPermissions.map(p => ({
          id: 0, // Doesn't matter as admin permissions are virtual
          roleId: 0,
          role: 'admin',
          resource: p.resource,
          action: p.action,
          createdAt: new Date(),
          updatedAt: null
        })) as RolePermission[];
      }
      
      // Get the role ID first from system roles table
      const [role] = await db.select()
        .from(roles)
        .where(eq(roles.name, roleName));
      
      if (!role) {
        console.log(`Role '${roleName}' not found in system roles table`);
        return []; // Role not found
      }
      
      console.log(`Found role '${roleName}' with ID ${role.id} in system roles table`);
      
      // Get permissions linked to this role directly (direct matching of roleId, resource, action)
      const rolePerms = await db.select()
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, role.id));
      
      console.log(`Found ${rolePerms.length} permissions for role '${roleName}'`);
      
      // Map to the expected format with role name included
      return rolePerms.map(rp => ({
        ...rp,
        role: roleName
      })) as RolePermission[];
    } catch (error) {
      console.error(`Error getting permissions for role '${roleName}':`, error);
      return [];
    }
  }
  
  async getAllRolePermissions(): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions);
  }
  
  async hasPermission(roleName: string, resource: string, action: string): Promise<boolean> {
    try {
      console.log(`Checking if role '${roleName}' has permission for resource='${resource}', action='${action}'`);
      
      // Admin always has all permissions (case insensitive)
      if (roleName.toLowerCase() === 'admin') {
        console.log(`Admin role has all permissions, returning true`);
        return true;
      }
      
      // Get the role from system roles table
      const [role] = await db.select().from(roles).where(eq(roles.name, roleName));
      if (!role) {
        console.log(`Role '${roleName}' not found, returning false`);
        return false;
      }
      
      // Direct check for permission by roleId, resource, and action
      const [rolePermission] = await db.select()
        .from(rolePermissions)
        .where(and(
          eq(rolePermissions.roleId, role.id),
          eq(rolePermissions.resource, resource),
          eq(rolePermissions.action, action)
        ));
      
      const hasPermission = !!rolePermission;
      console.log(`Role '${roleName}' ${hasPermission ? 'has' : 'does not have'} permission for resource='${resource}', action='${action}'`);
      
      return hasPermission;
    } catch (error) {
      console.error(`Error checking permission for role '${roleName}', resource='${resource}', action='${action}':`, error);
      return false;
    }
  }
  
  async createRolePermission(permission: InsertRolePermission): Promise<RolePermission> {
    try {
      let roleId: number;
      let resourceValue: string;
      let actionValue: string;
      
      // Case 1: If role name is provided as a string
      if (typeof permission.role === 'string') {
        // Get the role ID from system roles table
        const [role] = await db.select()
          .from(roles)
          .where(eq(roles.name, permission.role));

        if (!role) {
          throw new Error(`Role with name ${permission.role} not found`);
        }
        
        roleId = role.id;
        
        // Verify the resource/action exists in permissions table
        const [perm] = await db.select()
          .from(permissions)
          .where(and(
            eq(permissions.resource, permission.resource as any),
            eq(permissions.action, permission.action as any)
          ));
          
        if (!perm) {
          console.warn(`Warning: Permission with resource=${permission.resource} and action=${permission.action} not found in permissions table, but continuing`);
        }
        
        resourceValue = permission.resource;
        actionValue = permission.action;
      } 
      // Case 2: If roleId is provided directly
      else if (permission.roleId) {
        roleId = permission.roleId;
        resourceValue = permission.resource;
        actionValue = permission.action;
        
        // Get the role name for the response
        const [role] = await db.select()
          .from(roles)
          .where(eq(roles.id, roleId));
          
        if (role) {
          permission.role = role.name;
        }
      } 
      // Case 3: Invalid input
      else {
        throw new Error("Either 'role' or 'roleId' must be provided");
      }
      
      // Check if this permission already exists
      const existingPerm = await db.select()
        .from(rolePermissions)
        .where(and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.resource, resourceValue),
          eq(rolePermissions.action, actionValue)
        ));
        
      if (existingPerm.length > 0) {
        console.log(`Permission already exists for role ${permission.role || roleId} with resource=${resourceValue} and action=${actionValue}`);
        return existingPerm[0] as RolePermission;
      }
      
      // Create the role permission with explicit values
      const [createdPermission] = await db.insert(rolePermissions)
        .values({
          roleId,
          role: typeof permission.role === 'string' ? permission.role : null,
          resource: resourceValue,
          action: actionValue
        })
        .returning();
      
      console.log(`Created role permission for role ${permission.role || roleId} with resource=${resourceValue} and action=${actionValue}`, createdPermission);
      
      return createdPermission as RolePermission;
    } catch (error) {
      console.error("Error creating role permission:", error);
      throw error;
    }
  }
  
  async deleteRolePermission(rolePermission: InsertRolePermission): Promise<void> {
    try {
      // If the role field is provided (string)
      if (typeof rolePermission.role === 'string') {
        // Get the role ID
        const [role] = await db.select()
          .from(roles)
          .where(eq(roles.name, rolePermission.role));

        if (!role) {
          throw new Error(`Role with name ${rolePermission.role} not found`);
        }
        
        // Find the permission for the resource/action
        const [perm] = await db.select()
          .from(permissions)
          .where(and(
            eq(permissions.resource, rolePermission.resource as any),
            eq(permissions.action, rolePermission.action as any)
          ));
          
        if (!perm) {
          throw new Error(`Permission with resource=${rolePermission.resource} and action=${rolePermission.action} not found`);
        }
        
        // Delete the entry with roleId and matching resource/action
        await db.delete(rolePermissions)
          .where(and(
            eq(rolePermissions.roleId, role.id),
            eq(rolePermissions.resource, perm.resource),
            eq(rolePermissions.action, perm.action)
          ));
      } else if (rolePermission.roleId) {
        // Delete by roleId and resource/action
        await db.delete(rolePermissions)
          .where(and(
            eq(rolePermissions.roleId, rolePermission.roleId),
            eq(rolePermissions.resource, rolePermission.resource),
            eq(rolePermissions.action, rolePermission.action)
          ));
      } else {
        throw new Error("Invalid role permission data for deletion");
      }
    } catch (error) {
      console.error("Error deleting role permission:", error);
      throw error;
    }
  }
  
  async deleteAllRolePermissions(roleName: string): Promise<void> {
    try {
      // Get the role ID first
      const [role] = await db.select()
        .from(roles)
        .where(eq(roles.name, roleName));
      
      if (!role) {
        throw new Error(`Role with name ${roleName} not found`);
      }
      
      // Delete all permissions for this role
      await db.delete(rolePermissions)
        .where(eq(rolePermissions.roleId, role.id));
    } catch (error) {
      console.error(`Error deleting all permissions for role ${roleName}:`, error);
      throw error;
    }
  }
  
  async checkRolePermissionExists(roleName: string, resource: string, action: string): Promise<RolePermission | undefined> {
    try {
      // Get the role first from system roles table
      const [role] = await db.select()
        .from(roles)
        .where(eq(roles.name, roleName));
      
      if (!role) {
        return undefined; // Role doesn't exist
      }
      
      // Check if role has this permission directly by resource and action
      const [rolePermission] = await db.select()
        .from(rolePermissions)
        .where(and(
          eq(rolePermissions.roleId, role.id),
          eq(rolePermissions.resource, resource),
          eq(rolePermissions.action, action)
        ));
      
      if (!rolePermission) {
        return undefined;
      }
      
      // Return with the permission data
      return {
        ...rolePermission,
        role: roleName
      } as any;
    } catch (error) {
      console.error("Error checking role permission exists:", error);
      return undefined;
    }
  }
  
  async deleteRolePermissionsByRole(roleName: string): Promise<void> {
    try {
      // Get the role ID first from system roles table
      const [role] = await db.select()
        .from(roles)
        .where(eq(roles.name, roleName));
      
      if (!role) {
        throw new Error(`Role with name ${roleName} not found`);
      }
      
      // Delete all permissions for this role
      await db.delete(rolePermissions)
        .where(eq(rolePermissions.roleId, role.id));
    } catch (error) {
      console.error(`Error deleting permissions for role ${roleName}:`, error);
      throw error;
    }
  }
  
  // System Roles Management (using system roles table)
  async getRoleById(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }
  
  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role;
  }
  
  // Custom Roles Management (legacy, to be removed)
  async getCustomRole(id: number): Promise<CustomRole | undefined> {
    const [role] = await db.select().from(customRoles).where(eq(customRoles.id, id));
    return role;
  }
  
  async getCustomRoleByName(name: string): Promise<CustomRole | undefined> {
    const [role] = await db.select().from(customRoles).where(eq(customRoles.name, name));
    return role;
  }
  
  async getAllCustomRoles(): Promise<CustomRole[]> {
    try {
      console.log("Fetching all custom roles");
      const roles = await db.select().from(customRoles);
      console.log("Found custom roles:", roles);
      return roles;
    } catch (error) {
      console.error("Error fetching custom roles:", error);
      throw error;
    }
  }
  
  async createCustomRole(role: InsertCustomRole): Promise<CustomRole> {
    const [createdRole] = await db.insert(customRoles).values(role).returning();
    return createdRole;
  }
  
  async updateCustomRole(id: number, role: Partial<InsertCustomRole>): Promise<CustomRole | undefined> {
    // Update the updatedAt timestamp
    const updatedAt = new Date();
    const updatedRole = { ...role, updatedAt };
    
    const [result] = await db
      .update(customRoles)
      .set(updatedRole)
      .where(eq(customRoles.id, id))
      .returning();
    
    return result;
  }
  
  async deleteCustomRole(id: number): Promise<void> {
    // First delete all associated permissions
    const roleToDelete = await this.getCustomRole(id);
    if (roleToDelete) {
      await this.deleteRolePermissionsByRole(roleToDelete.name);
    }
    
    // Then delete the role
    await db.delete(customRoles).where(eq(customRoles.id, id));
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();
