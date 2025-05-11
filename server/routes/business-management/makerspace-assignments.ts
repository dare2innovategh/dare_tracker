import { Request, Response, Router } from 'express';
import { db } from '../../db';
import { 
  businessMakerspaceAssignments, 
  makerspaces, 
  businessProfiles,
  businessYouthRelationships, 
  youthProfiles,
  users,
  insertBusinessMakerspaceAssignmentSchema
} from '@shared/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { auth } from '../../middleware/auth';

const router = Router();

// Get all makerspace assignments - no auth for debugging
router.get('/assignments', async (req: Request, res: Response) => {
  try {
    console.log('Fetching all makerspace assignments');
    res.setHeader('Content-Type', 'application/json');
    
    // Select only columns that we're sure exist in the database table
    const assignments = await db.select({
      id: businessMakerspaceAssignments.id,
      businessId: businessMakerspaceAssignments.businessId,
      makerspaceId: businessMakerspaceAssignments.makerspaceId,
      assignedDate: businessMakerspaceAssignments.assignedDate,
      isActive: businessMakerspaceAssignments.isActive,
      assignedBy: businessMakerspaceAssignments.assignedBy
    }).from(businessMakerspaceAssignments);
    
    // Get user data for assignedBy
    const enhancedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        let assignedByUser = null;
        if (assignment.assignedBy) {
          const [user] = await db.select({
            id: users.id,
            username: users.username
          })
          .from(users)
          .where(eq(users.id, assignment.assignedBy));
          
          assignedByUser = user;
        }
        
        return {
          ...assignment,
          assignedByUser
        };
      })
    );
    
    console.log('Found assignments:', assignments.length);
    return res.json(enhancedAssignments);
  } catch (error) {
    console.error('Error fetching makerspace assignments:', error);
    return res.status(500).json({ message: 'Failed to fetch makerspace assignments' });
  }
});

// Route for specific makerspace
router.get('/makerspaces/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('Fetching makerspace with ID:', id);
    const [makerspace] = await db.select().from(makerspaces).where(eq(makerspaces.id, Number(id)));
    
    if (!makerspace) {
      console.log('Makerspace not found with ID:', id);
      return res.status(404).json({ message: 'Makerspace not found' });
    }
    
    console.log('Found makerspace:', makerspace);
    return res.json(makerspace);
  } catch (error) {
    console.error('Error fetching makerspace:', error);
    return res.status(500).json({ message: 'Failed to fetch makerspace' });
  }
});

// Get businesses assigned to a specific makerspace
router.get('/makerspaces/:id/businesses', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('Fetching businesses assigned to makerspace with ID:', id);
    res.setHeader('Content-Type', 'application/json');
    
    // First find the assignments for this makerspace
    const assignments = await db.select({
      id: businessMakerspaceAssignments.id,
      businessId: businessMakerspaceAssignments.businessId,
      makerspaceId: businessMakerspaceAssignments.makerspaceId,
      assignedDate: businessMakerspaceAssignments.assignedDate,
      isActive: businessMakerspaceAssignments.isActive,
      assignedBy: businessMakerspaceAssignments.assignedBy
    })
    .from(businessMakerspaceAssignments)
    .where(eq(businessMakerspaceAssignments.makerspaceId, Number(id)));
    
    console.log('Found assignments:', assignments.length);
    
    // Then get the business details for each assignment
    const businessDetails = await Promise.all(
      assignments.map(async (assignment) => {
        // Get business data
        const [business] = await db.select().from(businessProfiles).where(eq(businessProfiles.id, assignment.businessId));
        
        // Get business owners (youth with "Owner" role)
        const businessOwners = await db.select({
          youthId: businessYouthRelationships.youthId,
          role: businessYouthRelationships.role
        })
        .from(businessYouthRelationships)
        .where(
          and(
            eq(businessYouthRelationships.businessId, assignment.businessId),
            eq(businessYouthRelationships.isActive, true)
          )
        );
        
        console.log(`Found ${businessOwners.length} youth relationships for business ID ${assignment.businessId}`);
        
        // Get owner names from youth profiles
        let ownerNames: string[] = [];
        if (businessOwners.length > 0) {
          const youthIds = businessOwners.map(owner => owner.youthId);
          type YouthProfileResult = {
            id: number;
            fullName: string;
          };
          
          // Directly execute raw SQL to avoid type issues
          const result = await db.execute(sql`
            SELECT id, full_name AS "fullName"
            FROM youth_profiles
            WHERE id IN (${sql.join(youthIds, sql`, `)})
          `);
          
          const fetchedYouthProfiles = result.rows as { id: number; fullName: string }[];
          
          ownerNames = fetchedYouthProfiles.map((youth) => youth.fullName);
        }
        
        // Get assigned by user info if available
        let assignedByUser = null;
        if (assignment.assignedBy) {
          const [user] = await db.select({
            id: users.id,
            username: users.username
          })
          .from(users)
          .where(eq(users.id, assignment.assignedBy));
          
          assignedByUser = user;
        }
        
        return {
          ...assignment,
          business,
          ownerNames,
          assignedByUser
        };
      })
    );
    
    console.log('Returning business details with assignments:', businessDetails.length);
    return res.json(businessDetails);
  } catch (error) {
    console.error('Error fetching businesses for makerspace:', error);
    return res.status(500).json({ message: 'Failed to fetch businesses for makerspace' });
  }
});

// Get makerspace assignments for a specific business
router.get('/businesses/:id/makerspace-assignments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('Fetching makerspace assignments for business with ID:', id);
    res.setHeader('Content-Type', 'application/json');
    
    const assignments = await db.select({
      id: businessMakerspaceAssignments.id,
      businessId: businessMakerspaceAssignments.businessId,
      makerspaceId: businessMakerspaceAssignments.makerspaceId,
      assignedDate: businessMakerspaceAssignments.assignedDate,
      isActive: businessMakerspaceAssignments.isActive
    })
    .from(businessMakerspaceAssignments)
    .where(eq(businessMakerspaceAssignments.businessId, Number(id)));
    
    console.log('Found assignments:', assignments.length);
    
    // Get the makerspace details for each assignment
    const assignmentsWithDetails = await Promise.all(
      assignments.map(async (assignment) => {
        const [makerspace] = await db.select().from(makerspaces).where(eq(makerspaces.id, assignment.makerspaceId));
        return {
          ...assignment,
          makerspace
        };
      })
    );
    
    console.log('Returning assignments with makerspace details:', assignmentsWithDetails.length);
    return res.json(assignmentsWithDetails);
  } catch (error) {
    console.error('Error fetching makerspace assignments for business:', error);
    return res.status(500).json({ message: 'Failed to fetch makerspace assignments' });
  }
});

// Assign a business to a makerspace
router.post('/businesses/:id/makerspace-assignment', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { makerspaceId } = req.body;
    
    console.log('Assignment Request - businessId:', id, 'makerspaceId:', makerspaceId);
    console.log('Request body:', req.body);
    res.setHeader('Content-Type', 'application/json');
    
    // Get authenticated user (if available)
    const userId = req.user?.id || null;
    console.log('Authenticated user ID:', userId);
    
    // Basic validation first
    if (makerspaceId === undefined || makerspaceId === null) {
      return res.status(400).json({ message: 'Please select a makerspace to assign this business to.' });
    }
    
    // Convert IDs to numbers regardless of input format (string or number)
    const businessIdNum = Number(id);
    const makerspaceIdNum = Number(makerspaceId);
    
    // Check if conversions are valid
    if (isNaN(businessIdNum)) {
      return res.status(400).json({ message: 'The business information is invalid. Please try again.' });
    }
    
    if (isNaN(makerspaceIdNum)) {
      return res.status(400).json({ message: 'The selected makerspace is invalid. Please choose a different makerspace.' });
    }
    
    console.log('Processing with converted IDs:', {
      businessId: businessIdNum,
      makerspaceId: makerspaceIdNum,
      assignedBy: userId
    });
    
    // Check if business exists
    const [business] = await db.select().from(businessProfiles).where(eq(businessProfiles.id, businessIdNum));
    if (!business) {
      console.log('Business not found with ID:', businessIdNum);
      return res.status(404).json({ message: 'The business you\'re trying to assign could not be found in the system.' });
    }
    
    // Check if makerspace exists
    const [makerspace] = await db.select().from(makerspaces).where(eq(makerspaces.id, makerspaceIdNum));
    if (!makerspace) {
      console.log('Makerspace not found with ID:', makerspaceIdNum);
      return res.status(404).json({ message: 'The selected makerspace could not be found in the system.' });
    }
    
    // First, check if business is already assigned to ANY makerspace
    const anyExistingAssignments = await db.select({
      id: businessMakerspaceAssignments.id,
      businessId: businessMakerspaceAssignments.businessId,
      makerspaceId: businessMakerspaceAssignments.makerspaceId
    })
      .from(businessMakerspaceAssignments)
      .where(
        eq(businessMakerspaceAssignments.businessId, businessIdNum)
      );
    
    if (anyExistingAssignments.length > 0) {
      // Get the makerspace name for better error messaging
      const [existingMakerspace] = await db.select({
        name: makerspaces.name
      })
      .from(makerspaces)
      .where(eq(makerspaces.id, anyExistingAssignments[0].makerspaceId));
      
      const makerspaceInfo = existingMakerspace ? ` (${existingMakerspace.name})` : '';
      console.log(`Business is already assigned to makerspace ID ${anyExistingAssignments[0].makerspaceId}${makerspaceInfo}`);
      
      return res.status(400).json({ 
        message: `This business is already assigned to another makerspace${makerspaceInfo}. Each business can only be assigned to one makerspace.`
      });
    }
    
    // Then check if it's specifically assigned to this one (this should never happen now, but keeping for safety)
    const existingAssignments = await db.select({
      id: businessMakerspaceAssignments.id,
      businessId: businessMakerspaceAssignments.businessId,
      makerspaceId: businessMakerspaceAssignments.makerspaceId
    })
      .from(businessMakerspaceAssignments)
      .where(
        and(
          eq(businessMakerspaceAssignments.businessId, businessIdNum),
          eq(businessMakerspaceAssignments.makerspaceId, makerspaceIdNum)
        )
      );
    
    if (existingAssignments.length > 0) {
      console.log('Business is already assigned to this makerspace');
      return res.status(400).json({ 
        message: 'This business is already assigned to this makerspace.' 
      });
    }
    
    // Create the assignment
    try {
      console.log('Creating assignment with values:', {
        businessId: businessIdNum,
        makerspaceId: makerspaceIdNum,
        assignedDate: new Date(),
        isActive: true
      });
      
      // Use raw SQL to avoid column issues and include assigned_by
      const insertResult = await db.execute(
        sql`INSERT INTO business_makerspace_assignments 
          (business_id, makerspace_id, assigned_date, is_active, assigned_by)
          VALUES (${businessIdNum}, ${makerspaceIdNum}, ${new Date()}, ${true}, ${userId})
          RETURNING id, business_id as "businessId", makerspace_id as "makerspaceId", assigned_date as "assignedDate", is_active as "isActive", assigned_by as "assignedBy"`
      );
      
      const assignment = insertResult.rows[0];
      
      console.log('Assignment created successfully:', assignment);
      return res.status(201).json(assignment);
    } catch (err) {
      const insertError = err as Error;
      console.error('Error inserting assignment:', insertError);
      return res.status(500).json({ 
        message: 'Failed to insert assignment', 
        error: insertError.message || 'Unknown error occurred'
      });
    }
  } catch (err) {
    const error = err as Error;
    console.error('Error assigning business to makerspace:', error);
    res.status(500).json({ 
      message: 'Failed to assign business to makerspace',
      error: error.message || 'Unknown error occurred'
    });
  }
});

// Update a makerspace assignment
router.patch('/businesses/:businessId/makerspace-assignment/:id', async (req: Request, res: Response) => {
  try {
    const { businessId, id } = req.params;
    const { makerspaceId, isActive } = req.body;
    res.setHeader('Content-Type', 'application/json');
    
    // Convert IDs to numbers
    const businessIdNum = Number(businessId);
    const assignmentIdNum = Number(id);
    const makerspaceIdNum = makerspaceId ? Number(makerspaceId) : undefined;
    
    // Validate ID conversions
    if (isNaN(businessIdNum)) {
      return res.status(400).json({ message: 'The business information is invalid. Please try again.' });
    }
    
    if (isNaN(assignmentIdNum)) {
      return res.status(400).json({ message: 'The assignment information is invalid. Please try again.' });
    }
    
    if (makerspaceIdNum !== undefined && isNaN(makerspaceIdNum)) {
      return res.status(400).json({ message: 'The makerspace information is not valid. Please select a different makerspace.' });
    }
    
    // Check if assignment exists
    const [existingAssignment] = await db.select({
      id: businessMakerspaceAssignments.id, 
      businessId: businessMakerspaceAssignments.businessId,
      makerspaceId: businessMakerspaceAssignments.makerspaceId,
      isActive: businessMakerspaceAssignments.isActive
    })
      .from(businessMakerspaceAssignments)
      .where(
        and(
          eq(businessMakerspaceAssignments.id, assignmentIdNum),
          eq(businessMakerspaceAssignments.businessId, businessIdNum)
        )
      );
    
    if (!existingAssignment) {
      return res.status(404).json({ message: 'The makerspace assignment you\'re looking for could not be found. It may have been deleted.' });
    }
    
    // If changing to a different makerspace, check if the new assignment would be a duplicate
    if (makerspaceIdNum && makerspaceIdNum !== existingAssignment.makerspaceId) {
      const duplicateCheck = await db.select({
          id: businessMakerspaceAssignments.id,
          businessId: businessMakerspaceAssignments.businessId,
          makerspaceId: businessMakerspaceAssignments.makerspaceId
        })
        .from(businessMakerspaceAssignments)
        .where(
          and(
            eq(businessMakerspaceAssignments.businessId, businessIdNum),
            eq(businessMakerspaceAssignments.makerspaceId, makerspaceIdNum),
            // Exclude the current assignment ID
            sql`${businessMakerspaceAssignments.id} != ${assignmentIdNum}`
          )
        );
      
      if (duplicateCheck.length > 0) {
        return res.status(400).json({ message: 'This business is already assigned to the selected makerspace. A business can only be assigned to one makerspace at a time.' });
      }
    }
    
    // Update the assignment
    const [updatedAssignment] = await db.update(businessMakerspaceAssignments)
      .set({
        makerspaceId: makerspaceIdNum,
        isActive: isActive !== undefined ? isActive : undefined
      })
      .where(eq(businessMakerspaceAssignments.id, assignmentIdNum))
      .returning({
        id: businessMakerspaceAssignments.id,
        businessId: businessMakerspaceAssignments.businessId,
        makerspaceId: businessMakerspaceAssignments.makerspaceId,
        assignedDate: businessMakerspaceAssignments.assignedDate,
        isActive: businessMakerspaceAssignments.isActive
      });
    
    return res.json(updatedAssignment);
  } catch (error) {
    console.error('Error updating makerspace assignment:', error);
    return res.status(500).json({ message: 'We encountered a problem updating this makerspace assignment. Please try again later.' });
  }
});

// Delete a makerspace assignment
router.delete('/businesses/:businessId/makerspace-assignment/:id', async (req: Request, res: Response) => {
  try {
    const { businessId, id } = req.params;
    res.setHeader('Content-Type', 'application/json');
    
    // Convert IDs to numbers
    const businessIdNum = Number(businessId);
    const assignmentIdNum = Number(id);
    
    // Validate ID conversions
    if (isNaN(businessIdNum)) {
      return res.status(400).json({ message: 'The business information is invalid. Please try again.' });
    }
    
    if (isNaN(assignmentIdNum)) {
      return res.status(400).json({ message: 'The assignment information is invalid. Please try again.' });
    }
    
    // Check if assignment exists
    const [existingAssignment] = await db.select({
      id: businessMakerspaceAssignments.id, 
      businessId: businessMakerspaceAssignments.businessId
    })
      .from(businessMakerspaceAssignments)
      .where(
        and(
          eq(businessMakerspaceAssignments.id, assignmentIdNum),
          eq(businessMakerspaceAssignments.businessId, businessIdNum)
        )
      );
    
    if (!existingAssignment) {
      return res.status(404).json({ message: 'The makerspace assignment you\'re trying to delete could not be found. It may have been removed already.' });
    }
    
    // Delete the assignment
    await db.delete(businessMakerspaceAssignments)
      .where(eq(businessMakerspaceAssignments.id, assignmentIdNum));
    
    console.log(`Successfully deleted assignment ${assignmentIdNum} for business ${businessIdNum}`);
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting makerspace assignment:', error);
    return res.status(500).json({ message: 'We encountered a problem removing this makerspace assignment. Please try again later.' });
  }
});

export default router;