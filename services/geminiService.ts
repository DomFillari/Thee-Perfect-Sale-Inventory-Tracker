
import { GoogleGenAI, Type } from "@google/genai";

// 🔑 FALLBACK KEY: Uses the secure environment variable first, but falls back to this key if needed.
const FALLBACK_API_KEY = "AIzaSyA0DYUbuOS5L4vFaXcyZVPff6PmxH1KImg";

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix e.g. "data:image/jpeg;base64,"
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });

export const generateTags = async (
  imageFile: File,
  name: string,
  maker: string,
  category: string,
  description: string
): Promise<string[]> => {
  try {
    // Use the Env Secret first, or fall back to the provided key
    const apiKey = process.env.API_KEY || FALLBACK_API_KEY;
    
    if (!apiKey) {
        throw new Error("API Key is missing. Please check your configuration.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const imageBase64 = await fileToBase64(imageFile);

    const imagePart = {
      inlineData: {
        mimeType: imageFile.type,
        data: imageBase64,
      },
    };

    const textPart = {
      text: `Analyze the item in the image. Based on its name ("${name}"), maker ("${maker}"), category ("${category}"), and description ("${description}"), suggest 5-10 relevant tags for categorizing it for resale in an online store. Focus on keywords customers would search for.`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: 'A category tag for the warehouse item.'
              }
            }
          },
          required: ['tags']
        },
      },
    });

    const responseText = response.text?.trim();
    let parsed: { tags?: string[] } = {};
    if (responseText) {
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse JSON response from Gemini:", responseText, e);
        // If parsing fails, try to extract tags from a markdown-like list
        const fallbackTags = responseText.match(/"(.*?)"/g)?.map(t => t.replace(/"/g, '')) || [];
        if (fallbackTags.length > 0) {
            return fallbackTags;
        }
        return [];
      }
    }
    
    if (parsed && Array.isArray(parsed.tags)) {
      return parsed.tags;
    }
    
    return [];

  } catch (error: any) {
    console.error("Error generating tags:", error);
    // Handle specific 403 leaked key error
    if (error.message?.includes('403') || error.message?.includes('leaked')) {
        throw new Error("API Key Blocked: The key was flagged as leaked. Please generate a new key.");
    }
    throw new Error(error.message || "Failed to generate tags. Check console.");
  }
};

export interface AutoIdentifiedItem {
  name: string;
  maker: string;
  description: string;
  category: string;
  tags: string[];
  condition: string;
  price?: number;
  searchLinks?: { title: string; url: string }[];
}

export const identifyItem = async (imageFile: File): Promise<AutoIdentifiedItem> => {
  try {
    // Use the Env Secret first, or fall back to the provided key
    const apiKey = process.env.API_KEY || FALLBACK_API_KEY;

    if (!apiKey) {
        throw new Error("API Key is missing. Please check your configuration.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const imageBase64 = await fileToBase64(imageFile);

    const imagePart = {
      inlineData: {
        mimeType: imageFile.type,
        data: imageBase64,
      },
    };

    // The Forensic Appraiser Prompt - Tuned for "Lens-like" Accuracy
    const prompt = `
      Act as a Forensic Resale Appraiser. Your goal is to identify this item with extreme precision, utilizing the Google Search tool.

      PHASE 1: FORENSIC SCAN (Internal Thought Process)
      1. OCR extraction: Read EVERY visible letter, number, brand name, or serial code on the object. 
         - If text is found (e.g. "Nike", "Pyrex 404", "Patagonia"), you MUST include it in your search query.
      2. Visual Profiling: If no text is visible, identify the EXACT visual features:
         - Shape (e.g. "trumpet vase", "chelsea boot")
         - Material/Texture (e.g. "hobnail glass", "suede", "cast iron")
         - Pattern/Era (e.g. "Art Deco", "Mid-Century Modern", "Floral Chintz")

      PHASE 2: TARGETED SEARCH
      - Execute a Google Search using the extracted text or specific visual profile.
      - Prioritize "Sold" listings on eBay, Poshmark, Mercari, or 1stDibs to find the exact used/vintage match.
      - Look for the specific model name or pattern name.

      PHASE 3: REPORT GENERATION (Strict JSON)
      - "name": The precise title (e.g. "Vintage Fenton Hobnail Milk Glass Vase 6-inch").
      - "maker": The brand or artist.
      - "description": A "Google Lens" style AI Overview. Write 3-4 professional sentences describing what the item is, its likely era/origin, and key value features. Do not use conversational filler.
      - "price": An estimated market value (number only) based on comparable sold listings.
      - "tags": 5-8 specific keywords (e.g. "vintage", "milk glass", "fenton", "decor").

      OUTPUT RULES:
      - Return ONLY raw JSON. No markdown blocks (\`\`\`json).
      - Escape all double quotes inside strings (e.g. "12\\" ruler").
      - Do not include any text before or after the JSON object.
      
      JSON TEMPLATE:
      {
        "name": "String",
        "maker": "String",
        "description": "String",
        "category": "String (Home Goods|Apparel|Electronics|Collectibles|Other)",
        "condition": "String (Good|Vintage|New)",
        "tags": ["String"],
        "price": Number
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType omitted to allow tool use
      }
    });

    const responseText = response.text?.trim();
    if (!responseText) throw new Error("AI returned empty response.");

    console.log("AI Raw Response:", responseText);

    // Robust JSON Extraction
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("AI failed to generate a structured report.");
    }

    let jsonString = responseText.substring(jsonStart, jsonEnd + 1);
    
    // Aggressive sanitization to prevent parse errors
    jsonString = jsonString
        .replace(/[\n\r]/g, " ") // Remove line breaks
        .replace(/,\s*}/g, "}"); // Remove trailing commas

    let data: AutoIdentifiedItem;
    try {
        data = JSON.parse(jsonString) as AutoIdentifiedItem;
    } catch (e) {
        console.error("JSON Parse Error:", e);
        // Fallback: Try to clean unescaped quotes if simple parse fails
        try {
            const fixedJson = jsonString.replace(/(?<!\\)"/g, '\\"').replace(/\\"{/g, '{').replace(/}\\"/g, '}').replace(/\\":/g, '":').replace(/,\\"/g, ',"');
            data = JSON.parse(fixedJson);
        } catch (e2) {
             throw new Error("Failed to parse AI Overview. The item might be too obscure.");
        }
    }

    // Extract Search Links
    const candidates = response.candidates;
    const chunks = candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (chunks) {
        data.searchLinks = chunks
            .map((chunk: any) => {
                if (chunk.web) {
                    return { title: chunk.web.title, url: chunk.web.uri };
                }
                return null;
            })
            .filter((link: any) => link !== null);
    }

    return data;

  } catch (error: any) {
    console.error("Error identifying item:", error);
    // Handle specific 403 leaked key error
    if (error.message?.includes('403') || error.message?.includes('leaked')) {
        throw new Error("API Key Blocked: The key was flagged as leaked. Please generate a new key.");
    }
    throw new Error(error.message || "Identification failed. Please try again.");
  }
};
