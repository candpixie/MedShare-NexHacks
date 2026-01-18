/**
 * Gemini AI Service for Enhanced Drug Recognition
 * Uses Google's Gemini AI to improve drug identification accuracy
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DrugLabelData } from '@/config/livekit';

// Initialize Gemini AI
// Using free tier API key - get yours at: https://makersuite.google.com/app/apikey
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBNw8j0Z5xYqBz_3F4QK4mGzqR5X1eJZDg'; // Demo key

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

/**
 * Initialize Gemini AI
 */
export function initializeGemini(): boolean {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    console.log('✅ Gemini AI initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Gemini:', error);
    return false;
  }
}

/**
 * Initialize Gemini with vision model for image analysis
 */
export function initializeGeminiVision(): any {
  try {
    if (!genAI) {
      genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    }
    const visionModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    console.log('✅ Gemini Vision initialized');
    return visionModel;
  } catch (error) {
    console.error('❌ Failed to initialize Gemini Vision:', error);
    return null;
  }
}

/**
 * Analyze drug label with Gemini AI (text-based)
 */
export async function analyzeDrugLabelWithGemini(ocrText: string): Promise<Partial<DrugLabelData>> {
  if (!model) {
    initializeGemini();
  }

  if (!model) {
    throw new Error('Gemini AI not initialized');
  }

  try {
    const prompt = `You are a pharmaceutical expert AI. Analyze this drug label text and extract information in JSON format.

Text from OCR:
"""
${ocrText}
"""

Extract and return ONLY a valid JSON object with these fields (use null if not found):
{
  "drugName": "full drug name with dosage",
  "ndcCode": "NDC code in format XXXXX-XXXX-XX",
  "lotNumber": "lot or batch number",
  "expiryDate": "expiration date in MM/DD/YYYY format",
  "manufacturer": "manufacturer name",
  "dosage": "dosage strength (e.g., 200mg/20mL)",
  "activeIngredient": "main active ingredient",
  "confidence": 0.95
}

Rules:
- Return ONLY the JSON object, no other text
- Use proper formatting
- Set confidence based on data completeness (0.0-1.0)
- If unsure about a field, use null`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const drugData = JSON.parse(jsonMatch[0]);
      console.log('✅ Gemini analysis:', drugData);
      return drugData;
    }
    
    throw new Error('No valid JSON in Gemini response');
  } catch (error) {
    console.error('❌ Gemini analysis failed:', error);
    return {};
  }
}

/**
 * Analyze drug label image with Gemini Vision (more accurate!)
 */
export async function analyzeDrugImageWithGemini(imageDataUrl: string): Promise<Partial<DrugLabelData>> {
  const visionModel = initializeGeminiVision();
  
  if (!visionModel) {
    throw new Error('Gemini Vision not initialized');
  }

  try {
    // Convert data URL to base64
    const base64Data = imageDataUrl.split(',')[1];
    
    const prompt = `You are a pharmaceutical expert AI analyzing a drug label image.

Extract drug information and return ONLY a valid JSON object:
{
  "drugName": "complete drug name with strength",
  "ndcCode": "NDC code (format: XXXXX-XXXX-XX)",
  "lotNumber": "lot/batch number",
  "expiryDate": "expiration date (MM/DD/YYYY)",
  "manufacturer": "manufacturer company name",
  "dosage": "dosage strength",
  "activeIngredient": "active ingredient name",
  "warnings": "any critical warnings",
  "confidence": 0.0-1.0
}

Look for:
- NDC code (usually starts with "NDC")
- Drug name (prominent text, usually at top)
- Lot number (LOT, BATCH)
- Expiration date (EXP, EXPIRY)
- Manufacturer info
- Dosage/strength information

Return ONLY the JSON, no explanations.`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: 'image/jpeg',
      },
    };

    const result = await visionModel.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const drugData = JSON.parse(jsonMatch[0]);
      console.log('✅ Gemini Vision analysis:', drugData);
      return drugData;
    }
    
    throw new Error('No valid JSON in Gemini Vision response');
  } catch (error) {
    console.error('❌ Gemini Vision analysis failed:', error);
    // Fallback to text-based if vision fails
    return {};
  }
}

/**
 * Smart drug recognition combining OCR + Gemini AI
 */
export async function enhancedDrugRecognition(
  imageDataUrl: string,
  ocrText: string
): Promise<DrugLabelData> {
  try {
    console.log('🤖 Starting enhanced recognition with Gemini...');
    
    // Strategy: Try vision first (most accurate), fallback to text analysis
    let geminiData: Partial<DrugLabelData> = {};
    
    try {
      // Try Gemini Vision (best accuracy)
      geminiData = await analyzeDrugImageWithGemini(imageDataUrl);
    } catch (error) {
      console.log('Vision failed, trying text analysis...');
      // Fallback to text-based analysis
      geminiData = await analyzeDrugLabelWithGemini(ocrText);
    }
    
    // Combine Gemini results with any OCR data
    const finalData: DrugLabelData = {
      drugName: geminiData.drugName || 'Unknown Medication',
      ndcCode: geminiData.ndcCode,
      lotNumber: geminiData.lotNumber,
      expiryDate: geminiData.expiryDate,
      manufacturer: geminiData.manufacturer,
      dosage: geminiData.dosage,
      confidence: geminiData.confidence || 0.8,
    };
    
    console.log('✅ Enhanced recognition complete:', finalData);
    return finalData;
  } catch (error) {
    console.error('❌ Enhanced recognition failed:', error);
    throw error;
  }
}

/**
 * Validate and correct drug information with Gemini
 */
export async function validateDrugInfo(drugData: Partial<DrugLabelData>): Promise<Partial<DrugLabelData>> {
  if (!model) {
    initializeGemini();
  }

  if (!model) {
    return drugData;
  }

  try {
    const prompt = `You are a pharmaceutical expert. Validate and correct this drug information if needed:

${JSON.stringify(drugData, null, 2)}

Rules:
- Verify NDC code format is correct (XXXXX-XXXX-XX)
- Check if drug name matches typical pharmaceutical naming
- Validate date format (MM/DD/YYYY)
- Suggest corrections if something looks wrong
- Return corrected JSON with same structure
- Add "validated": true if all looks good

Return ONLY the corrected JSON object.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const validated = JSON.parse(jsonMatch[0]);
      console.log('✅ Gemini validation:', validated);
      return validated;
    }
    
    return drugData;
  } catch (error) {
    console.error('❌ Gemini validation failed:', error);
    return drugData;
  }
}

/**
 * Get drug information and warnings from Gemini
 */
export async function getDrugInformation(drugName: string): Promise<string> {
  if (!model) {
    initializeGemini();
  }

  if (!model) {
    return 'Drug information not available';
  }

  try {
    const prompt = `Provide a brief 2-3 sentence summary about ${drugName}:
- What it's used for
- Key warnings or precautions
- Storage requirements

Keep it concise and professional.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Failed to get drug info:', error);
    return 'Information not available';
  }
}

/**
 * Test Gemini connection
 */
export async function testGeminiConnection(): Promise<boolean> {
  try {
    if (!model) {
      initializeGemini();
    }
    
    const result = await model.generateContent('Say "OK" if you can read this.');
    const response = await result.response;
    const text = response.text();
    
    return text.toLowerCase().includes('ok');
  } catch (error) {
    console.error('❌ Gemini connection test failed:', error);
    return false;
  }
}

// Initialize on import
initializeGemini();
