// routes/training-programs.ts
import { Request, Response } from 'express';
import { db } from './db';

// Get all training programs
export const getTrainingPrograms = async (req: Request, res: Response) => {
  try {
    // Using "programName" instead of "name"
    const result = await db.query(
      `SELECT id, "programName", description, status, created_at, updated_at 
       FROM training_programs 
       ORDER BY "programName"`
    );
    
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching training programs:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch training programs', 
      error: error.message 
    });
  }
};

// Create a new training program
export const createTrainingProgram = async (req: Request, res: Response) => {
  const { programName, description, status } = req.body;
  
  try {
    // Using "programName" instead of "name"
    const result = await db.query(
      `INSERT INTO training_programs ("programName", description, status) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [programName, description, status]
    );
    
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating training program:', error);
    return res.status(500).json({ 
      message: 'Failed to create training program', 
      error: error.message 
    });
  }
};

// Get a specific training program
export const getTrainingProgramById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  
  try {
    // Using "programName" instead of "name"
    const result = await db.query(
      `SELECT id, "programName", description, status, created_at, updated_at 
       FROM training_programs 
       WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Training program not found' });
    }
    
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching training program:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch training program', 
      error: error.message 
    });
  }
};

// Update a training program
export const updateTrainingProgram = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { programName, description, status } = req.body;
  
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  
  try {
    // Using "programName" instead of "name"
    const result = await db.query(
      `UPDATE training_programs 
       SET "programName" = $1, description = $2, status = $3, updated_at = NOW() 
       WHERE id = $4 
       RETURNING *`,
      [programName, description, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Training program not found' });
    }
    
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating training program:', error);
    return res.status(500).json({ 
      message: 'Failed to update training program', 
      error: error.message 
    });
  }
};

// Delete a training program
export const deleteTrainingProgram = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  
  try {
    const result = await db.query(
      `DELETE FROM training_programs 
       WHERE id = $1 
       RETURNING id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Training program not found' });
    }
    
    return res.status(200).json({ message: 'Training program deleted successfully' });
  } catch (error) {
    console.error('Error deleting training program:', error);
    return res.status(500).json({ 
      message: 'Failed to delete training program', 
      error: error.message 
    });
  }
};

// Export all handlers
export default {
  getTrainingPrograms,
  createTrainingProgram,
  getTrainingProgramById,
  updateTrainingProgram,
  deleteTrainingProgram
};