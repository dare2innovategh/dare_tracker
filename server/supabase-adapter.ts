import { supabase } from './db';
import { 
  YouthProfile, 
  User, 
  Mentor, 
  BusinessProfile, 
  BusinessTracking
} from '@shared/schema';

/**
 * Utility class for direct interaction with Supabase tables
 * This bypasses the storage layer and works directly with Supabase
 */
export class SupabaseAdapter {
  /**
   * Insert a new youth profile into Supabase
   * @param data - The youth profile data
   * @returns The inserted record or null if failed
   */
  static async insertYouthProfile(data: Partial<YouthProfile>): Promise<any | null> {
    if (!supabase) return null;

    // Convert camelCase to snake_case for Supabase
    const record = this.convertToSnakeCase(data);

    try {
      const { data: result, error } = await supabase
        .from('youth_profiles')
        .insert(record)
        .select()
        .single();

      if (error) {
        console.error("Error inserting youth profile:", error);
        return null;
      }

      return result;
    } catch (error) {
      console.error("Exception inserting youth profile:", error);
      return null;
    }
  }

  /**
   * Insert a new business profile into Supabase
   * @param data - The business profile data
   * @returns The inserted record or null if failed
   */
  static async insertBusinessProfile(data: Partial<BusinessProfile>): Promise<any | null> {
    if (!supabase) return null;

    // Convert camelCase to snake_case for Supabase
    const record = this.convertToSnakeCase(data);

    try {
      const { data: result, error } = await supabase
        .from('business_profiles')
        .insert(record)
        .select()
        .single();

      if (error) {
        console.error("Error inserting business profile:", error);
        return null;
      }

      return result;
    } catch (error) {
      console.error("Exception inserting business profile:", error);
      return null;
    }
  }

  // Business tracking method removed as part of new tracking system implementation

  /**
   * Insert a new mentor record into Supabase
   * @param data - The mentor data
   * @returns The inserted record or null if failed
   */
  static async insertMentor(data: Partial<Mentor>): Promise<any | null> {
    if (!supabase) return null;

    // Convert camelCase to snake_case for Supabase
    const record = this.convertToSnakeCase(data);

    try {
      const { data: result, error } = await supabase
        .from('mentors')
        .insert(record)
        .select()
        .single();

      if (error) {
        console.error("Error inserting mentor:", error);
        return null;
      }

      return result;
    } catch (error) {
      console.error("Exception inserting mentor:", error);
      return null;
    }
  }

  /**
   * Insert a new user record into Supabase
   * @param data - The user data
   * @returns The inserted record or null if failed
   */
  static async insertUser(data: Partial<User>): Promise<any | null> {
    if (!supabase) return null;

    // Convert camelCase to snake_case for Supabase
    const record = this.convertToSnakeCase(data);

    try {
      const { data: result, error } = await supabase
        .from('users')
        .insert(record)
        .select()
        .single();

      if (error) {
        console.error("Error inserting user:", error);
        return null;
      }

      return result;
    } catch (error) {
      console.error("Exception inserting user:", error);
      return null;
    }
  }

  /**
   * Create a relationship between mentor and business
   * @param mentorId - The mentor ID
   * @param businessId - The business profile ID
   * @returns True if successful, false otherwise
   */
  static async createMentorBusinessRelationship(mentorId: number, businessId: number): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('mentor_business_relationships')
        .insert({
          mentor_id: mentorId,
          business_id: businessId,
          assigned_date: new Date().toISOString(),
        });

      if (error) {
        console.error("Error creating mentor-business relationship:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Exception creating mentor-business relationship:", error);
      return false;
    }
  }

  /**
   * Create a relationship between youth and business
   * @param youthId - The youth profile ID
   * @param businessId - The business profile ID
   * @param role - The role in the business (e.g., "Owner", "Member")
   * @returns True if successful, false otherwise
   */
  static async createBusinessYouthRelationship(
    youthId: number, 
    businessId: number,
    role: string = "Owner"
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('business_youth_relationships')
        .insert({
          youth_id: youthId,
          business_id: businessId,
          role: role,
          join_date: new Date().toISOString(),
        });

      if (error) {
        console.error("Error creating business-youth relationship:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Exception creating business-youth relationship:", error);
      return false;
    }
  }

  /**
   * Convert an object with camelCase keys to snake_case keys
   * @param obj - The object with camelCase keys
   * @returns A new object with snake_case keys
   */
  private static convertToSnakeCase(obj: any): any {
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

  /**
   * Convert an object with snake_case keys to camelCase keys
   * @param obj - The object with snake_case keys
   * @returns A new object with camelCase keys
   */
  static convertToCamelCase(obj: any): any {
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
}