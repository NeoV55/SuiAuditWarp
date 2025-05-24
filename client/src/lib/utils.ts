import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine multiple class names with tailwind-merge
 * This utility is used by shadcn/ui components
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Truncate an address for display
 * 
 * @param address The full address string
 * @param start Number of characters to show at start
 * @param end Number of characters to show at end
 * @returns Truncated address
 */
export function truncateAddress(address: string, start = 6, end = 4): string {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Format a date in a human-readable format
 * 
 * @param date Date object
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/**
 * Calculate a vulnerability score based on audit results
 * 
 * @param auditResult The audit result text
 * @returns A vulnerability score between 1 and 10
 */
export function getVulnerabilityScore(auditResult?: string): number {
  if (!auditResult) {
    return Math.floor(Math.random() * 10) + 1; // Fallback for demo
  }
  
  // Calculate score based on keywords in the audit result
  const criticalKeywords = ['critical', 'severe', 'high risk', 'dangerous', 'vulnerability', 'exploit'];
  const moderateKeywords = ['moderate', 'medium risk', 'potential issue', 'concern'];
  const minorKeywords = ['minor', 'low risk', 'note', 'suggestion', 'recommendation'];
  
  let score = 5; // Start with a moderate score
  
  // Analyze the audit text for vulnerability indicators
  const lowerCaseAudit = auditResult.toLowerCase();
  
  // Count critical issues
  const criticalCount = criticalKeywords.reduce((count, keyword) => {
    const regex = new RegExp(keyword, 'gi');
    const matches = lowerCaseAudit.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
  
  // Count moderate issues
  const moderateCount = moderateKeywords.reduce((count, keyword) => {
    const regex = new RegExp(keyword, 'gi');
    const matches = lowerCaseAudit.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
  
  // Count minor issues
  const minorCount = minorKeywords.reduce((count, keyword) => {
    const regex = new RegExp(keyword, 'gi');
    const matches = lowerCaseAudit.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
  
  // Calculate final score (higher score = more vulnerabilities)
  score += criticalCount * 1.5;
  score += moderateCount * 0.5;
  score += minorCount * 0.2;
  
  // Normalize to 1-10 range
  score = Math.max(1, Math.min(10, score));
  
  return parseFloat(score.toFixed(1));
}

/**
 * Convert a buffer to a hexadecimal string
 * 
 * @param buffer The buffer to convert
 * @returns Hexadecimal string
 */
export function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Parse an error message from various error types
 * 
 * @param error The error object
 * @returns A user-friendly error message
 */
export function parseErrorMessage(error: any): string {
  if (!error) return 'Unknown error occurred';
  
  // Handle different error types
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.reason) return error.reason;
  
  // Handle blockchain specific errors
  if (error.code) {
    switch (error.code) {
      case 4001:
        return 'Transaction rejected by user';
      case -32603:
        return 'Internal JSON-RPC error';
      default:
        return `Error code: ${error.code}`;
    }
  }
  
  return 'Unknown error occurred';
}

/**
 * Validate a contract address format
 * 
 * @param address The address to validate
 * @param type The blockchain type ('ethereum' or 'sui')
 * @returns Boolean indicating if the address is valid
 */
export function isValidAddress(address: string, type: 'ethereum' | 'sui'): boolean {
  if (!address) return false;
  
  if (type === 'ethereum') {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  } else if (type === 'sui') {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
  }
  
  return false;
}

/**
 * Get estimated read time for content
 * 
 * @param text The text to estimate
 * @param wordsPerMinute Average reading speed (default: 200)
 * @returns Estimated read time in minutes
 */
export function getReadingTime(text: string, wordsPerMinute = 200): number {
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}
