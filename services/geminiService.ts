
import { GoogleGenAI, Type } from "@google/genai";

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
    // Use the provided key directly if the environment variable is missing
    const apiKey = process.env.API_KEY || "AIzaSyAXRI1WaQ1m2JZ1g0uHSfr--rZ1955IzOk";
    
    if (!apiKey) {
        throw new Error("API Key not found.");
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
    // Use the provided key directly if the environment variable is missing
    const apiKey = process.env.API_KEY || "AIzaSyAXRI1WaQ1m2JZ1g0uHSfr--rZ1955IzOk";

    if (!apiKey) {
        throw new Error("API Key not found.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const imageBase64 = await fileToBase64(imageFile);

    const imagePart = {
      inlineData: {
        mimeType: imageFile.type,
        data: imageBase64,
      },
    };

    // The Ultimate "Reverse Image Search" Simulation Prompt
    const prompt = `
      You are an advanced Visual Search Engine. Your goal is to replicate the behavior of a Reverse Image Search using visual analysis.
      
      STEP 1: VISUAL ANALYSIS & SEARCH (Perform this internally)
      - Scan for text/logos. If none, build a visual description (shape, color, material).
      - Use 'googleSearch' to find market data and sold listings for this item.
      
      STEP 2: GENERATE RESPONSE
      - Identify the item name, maker, and category.
      - Write a detailed "AI Overview" description summarizing the item's history/value.
      - Estimate price.

      CRITICAL OUTPUT RULES:
      - Output ONLY a valid JSON object.
      - Do NOT output any conversational text, "Phase" headers, or markdown formatting (like \`\`\`json).
      - Escape all double quotes within strings (e.g., "The \\"quoted\\" word").
      - Do not use newlines inside string values.

      JSON STRUCTURE:
      {
        "name": "Specific Title (e.g. 'Fenton Hobnail Milk Glass Vase')",
        "maker": "Maker Name (or 'Unmarked [Style]')",
        "description": "AI Overview: [Your detailed 3-5 sentence summary derived from the search results. Explain what it is and its value context.]",
        "category": "Home Goods | Collectibles | Art | Other",
        "condition": "Visual Assessment (e.g. 'Vintage - Good')",
        "tags": ["tag1", "tag2", "material", "style", "era", "color"],
        "price": 0.00 (Estimated market value)
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        tools: [{ googleSearch: {} }], 
        // Note: responseMimeType is intentionally omitted as it conflicts with googleSearch tool use
      }
    });

    const responseText = response.text?.trim();
    if (!responseText) throw new Error("No response from AI");

    // Robust JSON extraction
    // Find the first '{' that is followed eventually by '}'
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
        console.error("Invalid AI Output:", responseText);
        throw new Error("AI could not generate the Overview.");
    }

    // Extract JSON and sanitize it
    let jsonString = responseText.substring(jsonStart, jsonEnd + 1);
    
    // Sanitize: Replace newlines inside the JSON string with spaces. 
    // This helps prevents parsing errors if the AI puts newlines inside description strings.
    // We strictly assume standard JSON format where real newlines are not structural outside of strings (and are ignored).
    jsonString = jsonString.replace(/[\n\r]/g, " ");

    let data: AutoIdentifiedItem;
    try {
        data = JSON.parse(jsonString) as AutoIdentifiedItem;
    } catch (e) {
        console.error("JSON Parse Error", e);
        console.error("Bad JSON String:", jsonString);
        throw new Error("Failed to parse AI Overview.");
    }

    // Extract Search Links for "Sources"
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
    // Pass the actual error message up to the UI
    throw new Error(error.message || "Failed to get AI Overview. Please try again.");
  }
};
