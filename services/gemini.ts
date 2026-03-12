
import { GoogleGenAI } from "@google/genai";

// Export a dummy ai instance to satisfy any stray imports causing SyntaxErrors.
export const ai = null;

// Helper to convert File or Blob to base64
export const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Robust wrapper for Gemini API calls that implements exponential backoff 
 * and jitter to handle 429 (Resource Exhausted) errors gracefully.
 */
export async function callGeminiWithRetry<T>(
  operation: (ai: any) => Promise<T>,
  maxRetries = 4,
  initialDelay = 2000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create a fresh instance for every attempt as per guidelines
      const aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
      return await operation(aiInstance);
    } catch (error: any) {
      lastError = error;
      const errorMsg = String(error?.message || "").toLowerCase();
      const isQuotaError = 
        error?.status === 429 || 
        error?.code === 429 ||
        errorMsg.includes('429') || 
        errorMsg.includes('resource_exhausted') ||
        errorMsg.includes('quota') ||
        errorMsg.includes('limit');

      if (isQuotaError && attempt < maxRetries) {
        // Exponential backoff: delay * 2^attempt + random jitter
        const delay = initialDelay * Math.pow(2, attempt) + (Math.random() * 800);
        console.warn(`Gemini Quota/Rate Limit (429). Retrying in ${Math.round(delay)}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
}
