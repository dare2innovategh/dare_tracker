/**
 * Script to delete all mentor profiles and their associated user accounts
 * This will remove mentors while maintaining other data in the system
 */
import { db } from "./db";
import { mentors, users, mentorBusinessRelationships, businessAdvice, mentorshipMessages } from "@shared/schema";
import { eq } from "drizzle-orm";

async function clearMentorData() {
  try {
    console.log("Starting to clear mentor data...");
    
    // Get all mentor records to find user IDs
    const mentorRecords = await db.select({ id: mentors.id, userId: mentors.userId }).from(mentors);
    console.log(`Found ${mentorRecords.length} mentor profiles to delete.`);
    
    // Extract user IDs from mentors
    const mentorUserIds = mentorRecords.map(mentor => mentor.userId).filter(id => id !== null) as number[];
    const mentorIds = mentorRecords.map(mentor => mentor.id);
    
    console.log(`Found ${mentorUserIds.length} mentor users to delete.`);
    
    // Start a transaction to ensure data consistency
    await db.transaction(async (tx) => {
      // First delete related records from mentor_business_relationships, mentorship_messages, and business_advice
      if (mentorIds.length > 0) {
        // Delete mentor-business associations
        const deletedAssociations = await tx.delete(mentorBusinessRelationships)
          .where(
            eq(mentorBusinessRelationships.mentorId, mentorIds[0])
          );
        console.log(`Deleted mentor-business associations.`);
        
        // Delete mentor messages
        const deletedMessages = await tx.delete(mentorshipMessages)
          .where(
            eq(mentorshipMessages.mentorId, mentorIds[0])
          );
        console.log(`Deleted mentor messages.`);
        
        // Delete mentor advice
        const deletedAdvice = await tx.delete(businessAdvice)
          .where(
            eq(businessAdvice.mentorId, mentorIds[0])
          );
        console.log(`Deleted mentor advice.`);
      }
      
      // Now delete mentor profiles
      const deletedMentors = await tx.delete(mentors);
      console.log(`Deleted ${deletedMentors.length || 'all'} mentor profiles.`);
      
      // Finally delete mentor user accounts
      if (mentorUserIds.length > 0) {
        for (const userId of mentorUserIds) {
          await tx.delete(users)
            .where(eq(users.id, userId));
        }
        console.log(`Deleted ${mentorUserIds.length} mentor user accounts.`);
      }
    });
    
    console.log("Successfully cleared all mentor data!");
  } catch (error) {
    console.error("Error clearing mentor data:", error);
    throw error;
  }
}

// Execute the function if this script is run directly
if (require.main === module) {
  clearMentorData()
    .then(() => {
      console.log("Mentor data clearing completed successfully.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to clear mentor data:", error);
      process.exit(1);
    });
}