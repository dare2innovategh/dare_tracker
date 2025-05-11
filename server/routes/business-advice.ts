import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertBusinessAdviceSchema } from "@shared/schema";

const businessAdviceRouter = Router();

// Get all business advice
businessAdviceRouter.get("/", async (req, res, next) => {
  try {
    const advice = await storage.getAllBusinessAdvice();
    res.status(200).json(advice);
  } catch (error) {
    next(error);
  }
});

// Get business advice by ID
businessAdviceRouter.get("/:id", async (req, res, next) => {
  try {
    const idParam = req.params.id.trim();
    const cleanId = idParam.replace(/\D/g, '');
    const id = parseInt(cleanId);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const advice = await storage.getBusinessAdviceById(id);
    
    if (!advice) {
      return res.status(404).json({ message: "Business advice not found" });
    }
    
    res.status(200).json(advice);
  } catch (error) {
    next(error);
  }
});

// Get all business advice for a specific business
businessAdviceRouter.get("/business/:businessId", async (req, res, next) => {
  try {
    const businessIdParam = req.params.businessId.trim();
    const cleanId = businessIdParam.replace(/\D/g, '');
    const businessId = parseInt(cleanId);
    
    if (isNaN(businessId)) {
      return res.status(400).json({ message: "Invalid business ID format" });
    }
    
    const advice = await storage.getBusinessAdviceByBusinessId(businessId);
    res.status(200).json(advice);
  } catch (error) {
    next(error);
  }
});

// Get all business advice from a specific mentor
businessAdviceRouter.get("/mentor/:mentorId", async (req, res, next) => {
  try {
    const mentorIdParam = req.params.mentorId.trim();
    const cleanId = mentorIdParam.replace(/\D/g, '');
    const mentorId = parseInt(cleanId);
    
    if (isNaN(mentorId)) {
      return res.status(400).json({ message: "Invalid mentor ID format" });
    }
    
    const advice = await storage.getBusinessAdviceByMentorId(mentorId);
    res.status(200).json(advice);
  } catch (error) {
    next(error);
  }
});

// Get advice between specific mentor and business
businessAdviceRouter.get("/mentor/:mentorId/business/:businessId", async (req, res, next) => {
  try {
    const mentorIdParam = req.params.mentorId.trim();
    const businessIdParam = req.params.businessId.trim();
    const mentorId = parseInt(mentorIdParam.replace(/\D/g, ''));
    const businessId = parseInt(businessIdParam.replace(/\D/g, ''));
    
    if (isNaN(mentorId) || isNaN(businessId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const advice = await storage.getBusinessAdviceByMentorAndBusiness(mentorId, businessId);
    res.status(200).json(advice);
  } catch (error) {
    next(error);
  }
});

// Create new business advice
businessAdviceRouter.post("/", async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Add the creator information
    const userId = req.user?.id;
    const data = {
      ...req.body,
      createdBy: userId
    };
    
    // Validate request body
    const validatedData = insertBusinessAdviceSchema.parse(data);
    const advice = await storage.createBusinessAdvice(validatedData);
    res.status(201).json(advice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    next(error);
  }
});

// Update business advice
businessAdviceRouter.patch("/:id", async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const idParam = req.params.id.trim();
    const cleanId = idParam.replace(/\D/g, '');
    const id = parseInt(cleanId);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    // First check if the advice exists
    const existingAdvice = await storage.getBusinessAdviceById(id);
    if (!existingAdvice) {
      return res.status(404).json({ message: "Business advice not found" });
    }
    
    // Add the updater information
    const userId = req.user?.id;
    const data = {
      ...req.body,
      updatedBy: userId,
      updatedAt: new Date()
    };
    
    // Validate request body for partial update
    const validatedData = insertBusinessAdviceSchema.partial().parse(data);
    const updatedAdvice = await storage.updateBusinessAdvice(id, validatedData);
    res.status(200).json(updatedAdvice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    next(error);
  }
});

// Delete business advice
businessAdviceRouter.delete("/:id", async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const idParam = req.params.id.trim();
    const cleanId = idParam.replace(/\D/g, '');
    const id = parseInt(cleanId);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    // First check if the advice exists
    const existingAdvice = await storage.getBusinessAdviceById(id);
    if (!existingAdvice) {
      return res.status(404).json({ message: "Business advice not found" });
    }
    
    await storage.deleteBusinessAdvice(id);
    res.status(200).json({ message: "Business advice deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default businessAdviceRouter;