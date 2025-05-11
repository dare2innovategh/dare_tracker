import { supabase } from './db';
import { 
  YouthProfile, 
  User, 
  Mentor, 
  BusinessProfile, 
  BusinessTracking,
  MentorBusinessRelationship,
  MentorshipMessage,
  ServiceSubcategory,
  Skill,
  YouthSkill,
  Education,
  Certification,
  TrainingProgram,
  YouthTraining,
  districtEnum
} from '@shared/schema';

/**
 * Supabase storage implementation
 * This provides database operations using the Supabase client
 */
export class SupabaseStorage {
  /**
   * Check if the Supabase client is available
   * @returns True if Supabase client is initialized
   */
  isSupabaseAvailable(): boolean {
    return !!supabase;
  }

  /**
   * Get a youth profile by ID
   * @param id - The profile ID
   * @returns The youth profile or undefined if not found
   */
  async getYouthProfile(id: number): Promise<YouthProfile | undefined> {
    if (!supabase) return undefined;

    const { data, error } = await supabase
      .from('youth_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;

    // Convert snake_case to camelCase
    return this.convertToCamelCase(data) as YouthProfile;
  }

  /**
   * Get all youth profiles
   * @returns Array of youth profiles
   */
  async getAllYouthProfiles(): Promise<YouthProfile[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('youth_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    // Convert snake_case to camelCase
    return data.map(profile => this.convertToCamelCase(profile)) as YouthProfile[];
  }

  /**
   * Get youth profiles by district
   * @param district - The district name
   * @returns Array of youth profiles in the specified district
   */
  async getYouthProfilesByDistrict(district: string): Promise<YouthProfile[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('youth_profiles')
      .select('*')
      .eq('district', district)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    // Convert snake_case to camelCase
    return data.map(profile => this.convertToCamelCase(profile)) as YouthProfile[];
  }

  /**
   * Create a new youth profile
   * @param profile - The youth profile data to create
   * @returns The created youth profile
   */
  async createYouthProfile(profile: Partial<YouthProfile>): Promise<YouthProfile | undefined> {
    if (!supabase) return undefined;

    // Convert camelCase to snake_case
    const snakeCaseProfile = this.convertToSnakeCase(profile);

    const { data, error } = await supabase
      .from('youth_profiles')
      .insert(snakeCaseProfile)
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating youth profile:", error);
      return undefined;
    }

    // Convert snake_case to camelCase
    return this.convertToCamelCase(data) as YouthProfile;
  }

  /**
   * Update a youth profile
   * @param id - The profile ID
   * @param profile - The updated profile data
   * @returns The updated youth profile
   */
  async updateYouthProfile(id: number, profile: Partial<YouthProfile>): Promise<YouthProfile | undefined> {
    if (!supabase) return undefined;

    // Convert camelCase to snake_case
    const snakeCaseProfile = this.convertToSnakeCase(profile);

    const { data, error } = await supabase
      .from('youth_profiles')
      .update(snakeCaseProfile)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error("Error updating youth profile:", error);
      return undefined;
    }

    // Convert snake_case to camelCase
    return this.convertToCamelCase(data) as YouthProfile;
  }

  /**
   * Delete a youth profile
   * @param id - The profile ID
   * @returns True if successful, false otherwise
   */
  async deleteYouthProfile(id: number): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('youth_profiles')
      .delete()
      .eq('id', id);

    return !error;
  }

  /**
   * Get a user by username
   * @param username - The username
   * @returns The user or undefined if not found
   */
  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!supabase) return undefined;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) return undefined;

    // Convert snake_case to camelCase
    return this.convertToCamelCase(data) as User;
  }

  /**
   * Create a new user
   * @param user - The user data to create
   * @returns The created user
   */
  async createUser(user: Partial<User>): Promise<User | undefined> {
    if (!supabase) return undefined;

    // Convert camelCase to snake_case
    const snakeCaseUser = this.convertToSnakeCase(user);

    const { data, error } = await supabase
      .from('users')
      .insert(snakeCaseUser)
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating user:", error);
      return undefined;
    }

    // Convert snake_case to camelCase
    return this.convertToCamelCase(data) as User;
  }
  
  /**
   * Get all users
   * @returns Array of users
   */
  async getAllUsers(): Promise<User[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    // Convert snake_case to camelCase
    return data.map(user => this.convertToCamelCase(user)) as User[];
  }
  
  /**
   * Get user by ID
   * @param id - The user ID
   * @returns The user or undefined if not found
   */
  async getUser(id: number): Promise<User | undefined> {
    if (!supabase) return undefined;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;

    // Convert snake_case to camelCase
    return this.convertToCamelCase(data) as User;
  }
  
  /**
   * Get all mentors
   * @returns Array of mentors
   */
  async getAllMentors(): Promise<Mentor[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('mentors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    // Convert snake_case to camelCase
    return data.map(mentor => this.convertToCamelCase(mentor)) as Mentor[];
  }
  
  /**
   * Get mentor by ID
   * @param id - The mentor ID
   * @returns The mentor or undefined if not found
   */
  async getMentor(id: number): Promise<Mentor | undefined> {
    if (!supabase) return undefined;

    const { data, error } = await supabase
      .from('mentors')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;

    // Convert snake_case to camelCase
    return this.convertToCamelCase(data) as Mentor;
  }
  
  /**
   * Create a new mentor
   * @param mentor - The mentor data to create
   * @returns The created mentor
   */
  async createMentor(mentor: Partial<Mentor>): Promise<Mentor | undefined> {
    if (!supabase) return undefined;

    // Convert camelCase to snake_case
    const snakeCaseMentor = this.convertToSnakeCase(mentor);

    const { data, error } = await supabase
      .from('mentors')
      .insert(snakeCaseMentor)
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating mentor:", error);
      return undefined;
    }

    // Convert snake_case to camelCase
    return this.convertToCamelCase(data) as Mentor;
  }
  
  /**
   * Get all business profiles
   * @returns Array of business profiles
   */
  async getAllBusinessProfiles(): Promise<BusinessProfile[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    // Convert snake_case to camelCase
    return data.map(business => this.convertToCamelCase(business)) as BusinessProfile[];
  }
  
  /**
   * Create a new business profile
   * @param business - The business profile data to create
   * @returns The created business profile
   */
  async createBusinessProfile(business: Partial<BusinessProfile>): Promise<BusinessProfile | undefined> {
    if (!supabase) return undefined;

    // Convert camelCase to snake_case
    const snakeCaseBusiness = this.convertToSnakeCase(business);

    const { data, error } = await supabase
      .from('business_profiles')
      .insert(snakeCaseBusiness)
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating business profile:", error);
      return undefined;
    }

    // Convert snake_case to camelCase
    return this.convertToCamelCase(data) as BusinessProfile;
  }
  
  /**
   * Create new business tracking data
   * @param tracking - The business tracking data to create
   * @returns The created business tracking data
   */
  async createBusinessTracking(tracking: Partial<BusinessTracking>): Promise<BusinessTracking | undefined> {
    if (!supabase) return undefined;

    // Convert camelCase to snake_case
    const snakeCaseTracking = this.convertToSnakeCase(tracking);

    const { data, error } = await supabase
      .from('business_tracking')
      .insert(snakeCaseTracking)
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating business tracking:", error);
      return undefined;
    }

    // Convert snake_case to camelCase
    return this.convertToCamelCase(data) as BusinessTracking;
  }

  /**
   * Convert an object with snake_case keys to camelCase keys
   * @param obj - The object with snake_case keys
   * @returns A new object with camelCase keys
   */
  private convertToCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertToCamelCase(item));
    }

    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((result, key) => {
        // Convert snake_case to camelCase
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = this.convertToCamelCase(obj[key]);
        return result;
      }, {} as any);
    }

    return obj;
  }

  /**
   * Convert an object with camelCase keys to snake_case keys
   * @param obj - The object with camelCase keys
   * @returns A new object with snake_case keys
   */
  private convertToSnakeCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertToSnakeCase(item));
    }

    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((result, key) => {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/([A-Z])/g, letter => `_${letter.toLowerCase()}`);
        result[snakeKey] = this.convertToSnakeCase(obj[key]);
        return result;
      }, {} as any);
    }

    return obj;
  }
}

// Export a singleton instance
export const supabaseStorage = new SupabaseStorage();