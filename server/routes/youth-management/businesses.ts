import { Router, Request, Response } from "express";
import { storage } from "../../storage";

const router = Router();

// Get all youth-business relationships (for youth selection)
router.get("/relationships", async (req: Request, res: Response) => {
  try {
    // Get map of youth id to business profiles
    const relationships = await storage.getAllYouthBusinessRelationships();
    return res.status(200).json(relationships);
  } catch (error) {
    console.error("Error fetching youth-business relationships:", error);
    return res.status(500).json({ message: "Failed to fetch relationships" });
  }
});

// Get all businesses associated with a youth profile
router.get("/:youthId", async (req: Request, res: Response) => {
  try {
    const youthId = parseInt(req.params.youthId);

    if (isNaN(youthId)) {
      return res.status(400).json({ message: "Invalid youth profile ID" });
    }

    // Get the youth profile to verify it exists
    const youthProfile = await storage.getYouthProfile(youthId);
    if (!youthProfile) {
      return res.status(404).json({ message: "Youth profile not found" });
    }

    // Get all businesses associated with this youth
    const businesses = await storage.getYouthBusinesses(youthId);
    
    return res.status(200).json(businesses);
  } catch (error) {
    console.error("Error fetching youth businesses:", error);
    return res.status(500).json({ message: "Failed to fetch associated businesses" });
  }
});

// Associate a business with a youth profile
router.post("/:youthId/associate", async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated and has permissions
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const youthId = parseInt(req.params.youthId);
    if (isNaN(youthId)) {
      return res.status(400).json({ message: "Invalid youth profile ID" });
    }
    
    const { businessId } = req.body;
    if (!businessId || isNaN(parseInt(businessId))) {
      return res.status(400).json({ message: "Valid business ID is required" });
    }
    
    const businessIdNumber = parseInt(businessId);
    
    // Admin or users with 'edit' permission on 'business_youth' can associate businesses
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      // Check permissions
      const permissions = await storage.getRolePermissionsByRole(userRole);
      const canManageAssociations = permissions.some(p => 
        p.resource === 'business_youth' && (p.action === 'edit' || p.action === 'create')
      );
      
      if (!canManageAssociations) {
        return res.status(403).json({ 
          message: 'You do not have permission to associate businesses with youth profiles' 
        });
      }
    }
    
    // Check if the youth profile exists
    const youthProfile = await storage.getYouthProfile(youthId);
    if (!youthProfile) {
      return res.status(404).json({ message: "Youth profile not found" });
    }
    
    // Check if the business exists
    const business = await storage.getBusinessProfile(businessIdNumber);
    if (!business) {
      return res.status(404).json({ message: "Business profile not found" });
    }
    
    // Check if association already exists
    const existingAssociations = await storage.getYouthBusinesses(youthId);
    const alreadyAssociated = existingAssociations.some(b => b.id === businessIdNumber);
    
    if (alreadyAssociated) {
      return res.status(409).json({ 
        message: "This business is already associated with this youth profile" 
      });
    }
    
    // Create the association
    await storage.associateYouthWithBusiness(youthId, businessIdNumber);
    
    return res.status(201).json({ 
      message: "Business successfully associated with youth profile",
      youthId,
      businessId: businessIdNumber
    });
  } catch (error) {
    console.error("Error associating business with youth:", error);
    return res.status(500).json({ 
      message: "Failed to associate business with youth profile" 
    });
  }
});

// Remove association between a business and a youth profile
router.delete("/:youthId/disassociate/:businessId", async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const youthId = parseInt(req.params.youthId);
    const businessId = parseInt(req.params.businessId);
    
    if (isNaN(youthId) || isNaN(businessId)) {
      return res.status(400).json({ 
        message: "Invalid IDs. Both youth ID and business ID must be numbers." 
      });
    }
    
    // Admin or users with 'delete' permission on 'business_youth' can remove associations
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin) {
      // Check permissions
      const permissions = await storage.getRolePermissionsByRole(userRole);
      const canRemoveAssociations = permissions.some(p => 
        p.resource === 'business_youth' && p.action === 'delete'
      );
      
      if (!canRemoveAssociations) {
        return res.status(403).json({ 
          message: 'You do not have permission to remove business associations' 
        });
      }
    }
    
    // Check if the association exists
    const youthBusinesses = await storage.getYouthBusinesses(youthId);
    const associationExists = youthBusinesses.some(b => b.id === businessId);
    
    if (!associationExists) {
      return res.status(404).json({ 
        message: "Association between this youth and business does not exist" 
      });
    }
    
    // Remove the association
    await storage.disassociateYouthFromBusiness(youthId, businessId);
    
    return res.status(200).json({ 
      message: "Business successfully disassociated from youth profile",
      youthId,
      businessId
    });
  } catch (error) {
    console.error("Error removing business association:", error);
    return res.status(500).json({ 
      message: "Failed to disassociate business from youth profile" 
    });
  }
});

export default router;