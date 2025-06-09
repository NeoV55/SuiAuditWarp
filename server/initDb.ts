import { db } from "./db";
import { users } from "@shared/schema";

/**
 * Initialize the database with necessary seed data
 */
export async function initializeDatabase() {
  try {
    console.log("Checking if users exist...");
    
    // Check for existing users using Drizzle
    const existingUsers = await db.select().from(users).limit(1);
    
    // If no users exist, create a default test user
    if (existingUsers.length === 0) {
      console.log("Creating default test user...");
      
      try {
        await db.insert(users).values({
          username: 'test_user',
          password: 'not_a_real_hash',
          email: 'test@auditwarp.com'
        });
        console.log("Default test user created successfully");
      } catch (insertError) {
        // If it's a unique constraint violation (user already exists), that's fine
        if (insertError.code === '23505') {
          console.log("Test user already exists, continuing...");
        } else {
          // For other errors, log and rethrow
          throw insertError;
        }
      }
    } else {
      console.log("Users already exist, skipping initialization");
    }
  } catch (error) {
    console.log("Database initialization warning:", error.message);
    // Don't throw the error, just log it - we want the server to start anyway
  }
}