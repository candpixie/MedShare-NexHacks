            /**
 * Drug Recognition Service
 * 
 * Uses OCR (Tesseract.js) to extract text from drug labels
 * and OpenFDA API to validate and enrich drug information
 */

import Tesseract from 'tesseract.js';
import type { DrugLabelData } from '@/config/livekit';
import { enhancedDrugRecognition, analyzeDrugLabelWithGemini } from './geminiAI';

// OpenFDA API base URL
const OPENFDA_API_BASE = 'https://api.fda.gov/drug';

/**
 * Perform OCR on an image to extract text
 */
export async function extractTextFromImage(imageDataUrl: string): Promise<string> {
  try {
    // Preprocess image for better OCR accuracy
    const preprocessedImage = await preprocessImage(imageDataUrl);
    
    const result = await Tesseract.recognize(preprocessedImage, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
      // Optimize for drug labels
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-/.:% ',
    });

    return result.data.text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Preprocess image to improve OCR accuracy
 */
async function preprocessImage(imageDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Set canvas size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Convert to grayscale and increase contrast
      for (let i = 0; i < data.length; i += 4) {
        // Grayscale conversion
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        
        // Increase contrast (make text darker, background lighter)
        const contrast = 1.5;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        const adjusted = factor * (gray - 128) + 128;
        
        // Threshold to pure black/white for better OCR
        const threshold = adjusted > 128 ? 255 : 0;
        
        data[i] = threshold;
        data[i + 1] = threshold;
        data[i + 2] = threshold;
      }
      
      // Put processed image back
      ctx.putImageData(imageData, 0, 0);
      
      // Return processed image
      resolve(canvas.toDataURL('image/jpeg', 1.0));
    };
    img.src = imageDataUrl;
  });
}

/**
 * Parse extracted text to find drug label information
 */
export function parseDrugLabelText(text: string): Partial<DrugLabelData> {
  const data: Partial<DrugLabelData> = {};

  // Clean up text
  const cleanText = text.replace(/\s+/g, ' ').trim();

  // Extract NDC Code (format: XXXXX-XXXX-XX or XXXXX-XXX-XX)
  const ndcPatterns = [
    /NDC[:\s]*(\d{5}-\d{4}-\d{2})/i,
    /NDC[:\s]*(\d{5}-\d{3}-\d{2})/i,
    /NDC[:\s]*(\d{4}-\d{4}-\d{2})/i,
    /(\d{5}-\d{4}-\d{2})/,
    /(\d{5}-\d{3}-\d{2})/,
    /(\d{4}-\d{4}-\d{2})/,
  ];

  for (const pattern of ndcPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      data.ndcCode = match[1];
      break;
    }
  }

  // Extract Lot Number
  const lotPatterns = [
    /LOT[:\s#]*([A-Z0-9]+)/i,
    /Lot[:\s#]*([A-Z0-9]+)/i,
    /BATCH[:\s#]*([A-Z0-9]+)/i,
    /Batch[:\s#]*([A-Z0-9]+)/i,
  ];

  for (const pattern of lotPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1].length >= 5 && match[1].length <= 20) {
      data.lotNumber = match[1];
      break;
    }
  }

  // Extract Expiration Date
  const expPatterns = [
    /EXP[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /EXPIR[A-Z]*[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /USE BY[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
  ];

  for (const pattern of expPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      data.expiryDate = normalizeDate(match[1]);
      break;
    }
  }

  // Extract dosage/strength (e.g., "200mg/20mL", "100mcg", "2%")
  const dosagePatterns = [
    /(\d+\.?\d*\s?(?:mg|mcg|g|mL|L|%)(?:\/\d+\.?\d*\s?(?:mg|mcg|g|mL|L))?)/i,
  ];

  for (const pattern of dosagePatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      data.dosage = match[1];
      break;
    }
  }

  // Try to extract drug name (usually at the beginning, capitalized)
  const lines = text.split('\n').filter(line => line.trim().length > 3);
  if (lines.length > 0) {
    // First substantial line is often the drug name
    const firstLine = lines[0].trim();
    if (firstLine.length >= 4 && firstLine.length <= 50) {
      data.drugName = firstLine;
    }
  }

  return data;
}

/**
 * Query OpenFDA API to get drug information by NDC code
 */
export async function queryOpenFDAByNDC(ndcCode: string): Promise<DrugLabelData | null> {
  try {
    // OpenFDA NDC Drug API endpoint
    const url = `${OPENFDA_API_BASE}/ndc.json?search=product_ndc:"${ndcCode}"&limit=1`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log('OpenFDA API returned non-OK status:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.log('No results found in OpenFDA for NDC:', ndcCode);
      return null;
    }

    const drug = data.results[0];

    return {
      drugName: drug.brand_name || drug.generic_name || 'Unknown Drug',
      ndcCode: ndcCode,
      manufacturer: drug.labeler_name || undefined,
      dosage: drug.active_ingredients?.[0]?.strength || undefined,
      confidence: 0.95, // High confidence from official FDA data
    };
  } catch (error) {
    console.error('OpenFDA API Error:', error);
    return null;
  }
}

/**
 * Query OpenFDA API by drug name
 */
export async function queryOpenFDAByName(drugName: string): Promise<DrugLabelData | null> {
  try {
    const url = `${OPENFDA_API_BASE}/ndc.json?search=brand_name:"${encodeURIComponent(drugName)}"&limit=1`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    const drug = data.results[0];

    return {
      drugName: drug.brand_name || drug.generic_name,
      ndcCode: drug.product_ndc,
      manufacturer: drug.labeler_name || undefined,
      dosage: drug.active_ingredients?.[0]?.strength || undefined,
      confidence: 0.85,
    };
  } catch (error) {
    console.error('OpenFDA API Error:', error);
    return null;
  }
}

/**
 * Main function: Process image and return drug information
 * NOW WITH GEMINI AI FOR BETTER ACCURACY! 🚀
 */
export async function recognizeDrugLabel(imageDataUrl: string): Promise<DrugLabelData> {
  console.log('🚀 Starting ENHANCED drug label recognition with Gemini AI...');

  try {
    // STRATEGY: Try Gemini AI first (most accurate), fallback to OCR+FDA
    console.log('🤖 Attempting Gemini AI recognition...');
    
    // Step 1: Extract text using OCR (in parallel with Gemini)
    const extractedTextPromise = extractTextFromImage(imageDataUrl);
    
    // Step 2: Try Gemini AI recognition (most accurate!)
    try {
      const geminiResult = await enhancedDrugRecognition(imageDataUrl, await extractedTextPromise);
      
      if (geminiResult.confidence && geminiResult.confidence > 0.7) {
        console.log('✅ Gemini AI recognition successful!', geminiResult);
        return geminiResult;
      }
    } catch (geminiError) {
      console.log('⚠️ Gemini AI failed, falling back to OCR+FDA:', geminiError);
    }
    
    // FALLBACK: Traditional OCR + FDA approach
    console.log('📝 Using OCR + FDA fallback...');
    const extractedText = await extractedTextPromise;
    console.log('Extracted text:', extractedText);

    // Step 3: Parse the text to extract drug information
    console.log('Step 2: Parsing drug information...');
    const parsedData = parseDrugLabelText(extractedText);
    console.log('Parsed data:', parsedData);
    
    // Step 4: Try Gemini text analysis for better parsing
    try {
      const geminiParsed = await analyzeDrugLabelWithGemini(extractedText);
      // Merge Gemini results with OCR parsed data
      Object.assign(parsedData, geminiParsed);
      console.log('✅ Enhanced with Gemini text analysis:', parsedData);
    } catch (error) {
      console.log('⚠️ Gemini text analysis failed, using OCR only');
    }

    // Step 5: Validate and enrich with OpenFDA API
    let enrichedData: DrugLabelData | null = null;

    if (parsedData.ndcCode) {
      console.log('Step 3a: Querying OpenFDA by NDC:', parsedData.ndcCode);
      enrichedData = await queryOpenFDAByNDC(parsedData.ndcCode);
    }

    if (!enrichedData && parsedData.drugName) {
      console.log('Step 3b: Querying OpenFDA by drug name:', parsedData.drugName);
      enrichedData = await queryOpenFDAByName(parsedData.drugName);
    }

    // Step 6: Combine all sources (Gemini + OCR + FDA)
    const finalData: DrugLabelData = {
      drugName: enrichedData?.drugName || parsedData.drugName || 'Unknown Medication',
      ndcCode: parsedData.ndcCode || enrichedData?.ndcCode,
      lotNumber: parsedData.lotNumber,
      expiryDate: parsedData.expiryDate,
      manufacturer: enrichedData?.manufacturer || parsedData.manufacturer,
      dosage: parsedData.dosage || enrichedData?.dosage,
      confidence: enrichedData ? enrichedData.confidence : (parsedData.confidence || 0.7),
    };

    console.log('✅ Final recognized data:', finalData);
    return finalData;
    
  } catch (error) {
    console.error('❌ Drug recognition failed:', error);
    throw error;
  }
}

/**
 * Normalize date formats to MM/DD/YYYY
 */
function normalizeDate(dateStr: string): string {
  try {
    // Handle various date formats
    const cleaned = dateStr.replace(/[^\d\/\-]/g, '');
    const parts = cleaned.split(/[-\/]/);

    if (parts.length === 3) {
      let [part1, part2, part3] = parts;

      // If year is 2 digits, convert to 4 digits
      if (part3.length === 2) {
        const year = parseInt(part3);
        part3 = (year > 50 ? '19' : '20') + part3;
      }

      // Assume MM/DD/YYYY format
      if (part1.length <= 2 && part2.length <= 2) {
        return `${part1.padStart(2, '0')}/${part2.padStart(2, '0')}/${part3}`;
      }
    }

    return dateStr;
  } catch (error) {
    return dateStr;
  }
}

/**
 * Calculate confidence score based on what data was extracted
 */
export function calculateConfidence(data: Partial<DrugLabelData>): number {
  let score = 0;

  if (data.ndcCode) score += 0.3;
  if (data.drugName && data.drugName !== 'Unknown Medication') score += 0.3;
  if (data.lotNumber) score += 0.15;
  if (data.expiryDate) score += 0.15;
  if (data.dosage) score += 0.1;

  return Math.min(score, 1.0);
}

/**
 * Test function to check if OpenFDA API is accessible
 */
export async function testOpenFDAConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${OPENFDA_API_BASE}/ndc.json?limit=1`);
    return response.ok;
  } catch (error) {
    console.error('OpenFDA connection test failed:', error);
    return false;
  }
}
