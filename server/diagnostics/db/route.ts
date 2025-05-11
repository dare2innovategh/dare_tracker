// Create this file at /app/api/diagnostics/db/route.ts

import { NextResponse } from 'next/server';
import { diagnoseBusiness, getRawBusinessProfiles, auditBusinessRecords } from '@/lib/debug-utils';
import { db } from '@/lib/db'; // Adjust import based on your project structure

// This route is for administrative debugging only
// Make sure to protect it in production

export async function GET(request: Request) {
  try {
    // Get the URL params
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'general';
    const businessId = url.searchParams.get('businessId');
    
    // General information about the database
    if (action === 'general') {
      const generalDiagnostics = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? '✓ Set' : '✗ Missing',
        // Add other general diagnostics here
      };
      
      return NextResponse.json({ diagnostics: generalDiagnostics });
    }
    
    // Business-specific diagnostics
    if (action === 'business') {
      const result = await diagnoseBusiness(businessId ? parseInt(businessId) : undefined);
      return NextResponse.json(result);
    }
    
    // Raw business profiles data
    if (action === 'raw') {
      const result = await getRawBusinessProfiles();
      return NextResponse.json(result);
    }
    
    // Full audit of business records
    if (action === 'audit') {
      const result = await auditBusinessRecords();
      return NextResponse.json(result);
    }
    
    // Get schema information
    if (action === 'schema') {
      // This is a simple schema analysis to help diagnose issues
      try {
        // Try to execute a simple schema query to see if it works
        const schemaAnalysis = {
          businessProfilesTable: await db.execute('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1', ['business_profiles']),
          // Add other schema-related queries here
        };
        
        return NextResponse.json({ schema: schemaAnalysis });
      } catch (error) {
        return NextResponse.json({ 
          error: 'Schema analysis failed',
          message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
      }
    }
    
    // Unknown action
    return NextResponse.json({ error: 'Unknown diagnostic action' }, { status: 400 });
    
  } catch (error) {
    console.error('Error in diagnostic endpoint:', error);
    
    return NextResponse.json({
      error: 'Diagnostic error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// Add additional endpoints as needed for more specific diagnostics