import { db } from "./db";
import { pool } from "./db";

/**
 * Initialize the database with necessary seed data
 */
export async function initializeDatabase() {
  try {
    console.log("Checking if users exist...");
    
    // Use the pool directly for this initialization query
    const userCountResult = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(userCountResult.rows[0].count);
    
    // If no users exist, create a default test user
    if (userCount === 0) {
      console.log("Creating default test user...");
      
      try {
        // Insert a test user with direct SQL
        await pool.query(`
          INSERT INTO users (username, password, email, wallet_address)
          VALUES ('test_user', 'not_a_real_hash', 'test@auditwarp.com', NULL)
        `);
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