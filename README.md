# DARE Youth Job Tracker

A comprehensive platform for tracking youth employment, business performance, and mentorship in Ghana's DARE program.

## Features

- Youth profile management with certification tracking
- Business performance monitoring
- Feasibility assessment tool based on DARE Transition Program Framework
- Mentor assignment and tracking
- Makerspace resource management
- Comprehensive permission system
- Dashboard with key statistics

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based authentication

## Deployment Guide

### Prerequisites

1. Node.js (v18+)
2. PostgreSQL (v14+)
3. Git

### Local Development Setup

1. Clone the repository:
   ```
   # Using the GitHub token:
   git clone https://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@github.com/dare2innovategh/Youth-In-Job-Tracker.git
   
   # Or if you've already been added as a collaborator:
   git clone https://github.com/dare2innovategh/Youth-In-Job-Tracker.git
   
   cd Youth-In-Job-Tracker
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=postgres://username:password@localhost:5432/dare_youth_tracker
   SESSION_SECRET=your_session_secret
   ```

4. Set up the database:
   ```
   # Create the database
   createdb dare_youth_tracker
   
   # Push the schema to the database
   npm run db:push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

### Database Migration and Setup Guide

The application uses Drizzle ORM for database management. Here's how to handle database operations:

#### Schema Updates

The database schema is defined in `shared/schema.ts`. When you make changes to the schema:

1. Update the schema file with your changes
2. Run the migration command:
   ```
   npm run db:push
   ```

This will update your database schema without losing data (when possible).

#### Database Migration Issues

If you encounter issues with database migrations:

1. **Connection Problems**:
   - Verify your DATABASE_URL is correct
   - Ensure the PostgreSQL server is running
   - Check that the database exists and is accessible
   - Test your connection with: `psql $DATABASE_URL`

2. **Schema Conflicts**:
   - If there are conflicts between local schema and db schema:
     ```
     # Generate a new migration
     npm run db:generate
     
     # Apply the migration
     npm run db:migrate
     ```

3. **Data Integrity Issues**:
   - For complex data transformations, create a custom migration script
   - Place custom scripts in the `migrations` folder
   - Run them manually after schema updates

#### Production Database Setup

For production deployment:

1. Create a production PostgreSQL database
2. Set the DATABASE_URL environment variable to your production database
3. Run `npm run db:push` to apply the schema
4. Optional: Seed initial data with `node scripts/seed-production-db.js`

#### Backup and Restore

Regular backups are recommended:

```
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_file.sql
```

### Production Deployment

1. Build the production version:
   ```
   npm run build
   ```

2. Start the production server:
   ```
   npm start
   ```

For cloud deployment, follow the specific instructions for your hosting platform (Heroku, Railway, Render, etc.)

## Project Structure

- `/client` - React frontend code
- `/server` - Express backend code
- `/shared` - Shared types and utilities
- `/migrations` - Database migration files
- `/public` - Static assets

## License

This project is proprietary software owned by DARE Ghana.

## Contact

For support or questions, contact the DARE Ghana team.