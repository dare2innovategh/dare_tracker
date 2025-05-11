import { Router } from "express";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { 
  portfolioProjects, 
  projectImages, 
  testimonials, 
  socialMediaLinks,
  insertPortfolioProjectSchema,
  insertProjectImageSchema,
  insertTestimonialSchema,
  insertSocialMediaLinkSchema
} from "@shared/schema";

const router = Router();

// Get all portfolio projects for a youth
router.get("/portfolio-projects/youth/:youthId", async (req, res) => {
  try {
    const youthId = parseInt(req.params.youthId);
    if (isNaN(youthId)) {
      return res.status(400).json({ error: "Invalid youth ID" });
    }
    
    const projects = await db.select().from(portfolioProjects)
      .where(eq(portfolioProjects.youthId, youthId))
      .orderBy(portfolioProjects.isFeatured, portfolioProjects.createdAt);
    
    res.json(projects);
  } catch (error) {
    console.error("Error fetching portfolio projects:", error);
    res.status(500).json({ error: "Failed to fetch portfolio projects" });
  }
});

// Get a specific portfolio project
router.get("/portfolio-projects/:projectId", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: "Invalid project ID" });
    }
    
    const [project] = await db.select().from(portfolioProjects)
      .where(eq(portfolioProjects.id, projectId));
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    res.json(project);
  } catch (error) {
    console.error("Error fetching portfolio project:", error);
    res.status(500).json({ error: "Failed to fetch portfolio project" });
  }
});

// Create a new portfolio project
router.post("/portfolio-projects", async (req, res) => {
  try {
    const validatedData = insertPortfolioProjectSchema.parse(req.body);
    
    const [project] = await db.insert(portfolioProjects)
      .values(validatedData)
      .returning();
    
    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating portfolio project:", error);
    res.status(400).json({ error: "Failed to create portfolio project" });
  }
});

// Update a portfolio project
router.patch("/portfolio-projects/:projectId", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: "Invalid project ID" });
    }
    
    const validatedData = insertPortfolioProjectSchema.partial().parse(req.body);
    
    const [updatedProject] = await db.update(portfolioProjects)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(eq(portfolioProjects.id, projectId))
      .returning();
    
    if (!updatedProject) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    res.json(updatedProject);
  } catch (error) {
    console.error("Error updating portfolio project:", error);
    res.status(400).json({ error: "Failed to update portfolio project" });
  }
});

// Delete a portfolio project
router.delete("/portfolio-projects/:projectId", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: "Invalid project ID" });
    }
    
    // First delete all images associated with this project
    await db.delete(projectImages)
      .where(eq(projectImages.projectId, projectId));
    
    // Then delete all testimonials associated with this project
    await db.delete(testimonials)
      .where(eq(testimonials.projectId, projectId));
    
    // Finally delete the project
    const [deletedProject] = await db.delete(portfolioProjects)
      .where(eq(portfolioProjects.id, projectId))
      .returning();
    
    if (!deletedProject) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting portfolio project:", error);
    res.status(500).json({ error: "Failed to delete portfolio project" });
  }
});

// Get all project images for a youth
router.get("/project-images/youth/:youthId", async (req, res) => {
  try {
    const youthId = parseInt(req.params.youthId);
    if (isNaN(youthId)) {
      return res.status(400).json({ error: "Invalid youth ID" });
    }
    
    // Get all projects for this youth
    const projects = await db.select().from(portfolioProjects)
      .where(eq(portfolioProjects.youthId, youthId));
    
    const projectIds = projects.map(p => p.id);
    
    // Get all images for these projects
    let images = [];
    
    if (projectIds.length > 0) {
      // If there are projects, query all images for these projects
      for (const projectId of projectIds) {
        const projectImages = await db.select().from(projectImages)
          .where(eq(projectImages.projectId, projectId))
          .orderBy(projectImages.sortOrder);
        
        images = [...images, ...projectImages];
      }
    }
    
    res.json(images);
  } catch (error) {
    console.error("Error fetching project images:", error);
    res.status(500).json({ error: "Failed to fetch project images" });
  }
});

// Get all images for a specific project
router.get("/project-images/project/:projectId", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: "Invalid project ID" });
    }
    
    const images = await db.select().from(projectImages)
      .where(eq(projectImages.projectId, projectId))
      .orderBy(projectImages.sortOrder);
    
    res.json(images);
  } catch (error) {
    console.error("Error fetching project images:", error);
    res.status(500).json({ error: "Failed to fetch project images" });
  }
});

// Add a new project image
router.post("/project-images", async (req, res) => {
  try {
    const validatedData = insertProjectImageSchema.parse(req.body);
    
    const [image] = await db.insert(projectImages)
      .values(validatedData)
      .returning();
    
    res.status(201).json(image);
  } catch (error) {
    console.error("Error creating project image:", error);
    res.status(400).json({ error: "Failed to create project image" });
  }
});

// Delete a project image
router.delete("/project-images/:imageId", async (req, res) => {
  try {
    const imageId = parseInt(req.params.imageId);
    if (isNaN(imageId)) {
      return res.status(400).json({ error: "Invalid image ID" });
    }
    
    const [deletedImage] = await db.delete(projectImages)
      .where(eq(projectImages.id, imageId))
      .returning();
    
    if (!deletedImage) {
      return res.status(404).json({ error: "Image not found" });
    }
    
    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting project image:", error);
    res.status(500).json({ error: "Failed to delete project image" });
  }
});

// Get all testimonials for a youth
router.get("/testimonials/youth/:youthId", async (req, res) => {
  try {
    const youthId = parseInt(req.params.youthId);
    if (isNaN(youthId)) {
      return res.status(400).json({ error: "Invalid youth ID" });
    }
    
    const testimonialsData = await db.select().from(testimonials)
      .where(eq(testimonials.youthId, youthId))
      .orderBy(testimonials.dateReceived, testimonials.createdAt);
    
    res.json(testimonialsData);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({ error: "Failed to fetch testimonials" });
  }
});

// Add a new testimonial
router.post("/testimonials", async (req, res) => {
  try {
    const validatedData = insertTestimonialSchema.parse(req.body);
    
    const [testimonial] = await db.insert(testimonials)
      .values(validatedData)
      .returning();
    
    res.status(201).json(testimonial);
  } catch (error) {
    console.error("Error creating testimonial:", error);
    res.status(400).json({ error: "Failed to create testimonial" });
  }
});

// Delete a testimonial
router.delete("/testimonials/:testimonialId", async (req, res) => {
  try {
    const testimonialId = parseInt(req.params.testimonialId);
    if (isNaN(testimonialId)) {
      return res.status(400).json({ error: "Invalid testimonial ID" });
    }
    
    const [deletedTestimonial] = await db.delete(testimonials)
      .where(eq(testimonials.id, testimonialId))
      .returning();
    
    if (!deletedTestimonial) {
      return res.status(404).json({ error: "Testimonial not found" });
    }
    
    res.json({ message: "Testimonial deleted successfully" });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    res.status(500).json({ error: "Failed to delete testimonial" });
  }
});

// Get all social media links for a youth
router.get("/social-media-links/youth/:youthId", async (req, res) => {
  try {
    const youthId = parseInt(req.params.youthId);
    if (isNaN(youthId)) {
      return res.status(400).json({ error: "Invalid youth ID" });
    }
    
    const links = await db.select().from(socialMediaLinks)
      .where(eq(socialMediaLinks.youthId, youthId))
      .orderBy(socialMediaLinks.platform);
    
    res.json(links);
  } catch (error) {
    console.error("Error fetching social media links:", error);
    res.status(500).json({ error: "Failed to fetch social media links" });
  }
});

// Add a new social media link
router.post("/social-media-links", async (req, res) => {
  try {
    const validatedData = insertSocialMediaLinkSchema.parse(req.body);
    
    const [link] = await db.insert(socialMediaLinks)
      .values(validatedData)
      .returning();
    
    res.status(201).json(link);
  } catch (error) {
    console.error("Error creating social media link:", error);
    res.status(400).json({ error: "Failed to create social media link" });
  }
});

// Update a social media link
router.patch("/social-media-links/:linkId", async (req, res) => {
  try {
    const linkId = parseInt(req.params.linkId);
    if (isNaN(linkId)) {
      return res.status(400).json({ error: "Invalid link ID" });
    }
    
    const validatedData = insertSocialMediaLinkSchema.partial().parse(req.body);
    
    const [updatedLink] = await db.update(socialMediaLinks)
      .set(validatedData)
      .where(eq(socialMediaLinks.id, linkId))
      .returning();
    
    if (!updatedLink) {
      return res.status(404).json({ error: "Link not found" });
    }
    
    res.json(updatedLink);
  } catch (error) {
    console.error("Error updating social media link:", error);
    res.status(400).json({ error: "Failed to update social media link" });
  }
});

// Delete a social media link
router.delete("/social-media-links/:linkId", async (req, res) => {
  try {
    const linkId = parseInt(req.params.linkId);
    if (isNaN(linkId)) {
      return res.status(400).json({ error: "Invalid link ID" });
    }
    
    const [deletedLink] = await db.delete(socialMediaLinks)
      .where(eq(socialMediaLinks.id, linkId))
      .returning();
    
    if (!deletedLink) {
      return res.status(404).json({ error: "Link not found" });
    }
    
    res.json({ message: "Link deleted successfully" });
  } catch (error) {
    console.error("Error deleting social media link:", error);
    res.status(500).json({ error: "Failed to delete social media link" });
  }
});

export default router;