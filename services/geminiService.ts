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
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
        throw new Error("Received an invalid response from the AI tag generator.");
      }
    }
    
    if (parsed && Array.isArray(parsed.tags)) {
      return parsed.tags;
    }
    
    return [];

  } catch (error) {
    console.error("Error generating tags:", error);
    throw new Error("Failed to generate tags. Please check the console for more details.");
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
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imageBase64 = await fileToBase64(imageFile);

    const imagePart = {
      inlineData: {
        mimeType: imageFile.type,
        data: imageBase64,
      },
    };

    // Prompt optimized to simulate Google Lens behavior and extract data
    const prompt = `
      You are an expert appraiser and visual search engine.
      Your goal is to simulate "Google Lens" behavior inside this app to automatically fill a data entry form.

      1. SEARCH: Use the 'googleSearch' tool to find this specific item online.
         - Look for sold listings (eBay, 1stDibs, Chairish) to find accurate market data.
         - Look for museum or catalog entries for antiques or art.
         - If it is a generic item, find the most comparable listings.
      
      2. IDENTIFY:
         - Determine the exact Name/Title (Year, Brand, Model/Pattern).
         - Identify the Maker/Artist.
         - Estimate the current market Value/Price (average of found listings) as a number.

      3. DESCRIBE:
         - Write a professional description suitable for a sales listing.
         - Include era, style, material, measurements (visual estimate), and key features.

      RETURN JSON ONLY in this format:
      {
        "name": "Item Title",
        "maker": "Brand/Artist (or 'Unmarked')",
        "description": "Detailed sales description...",
        "category": "Best fitting category",
        "condition": "Visual condition (e.g., 'Good Vintage Condition')",
        "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
        "price": 0.00
      }
      
      Note: 'price' must be a number (no currency symbols). If unknown, return null.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        tools: [{ googleSearch: {} }],
        // Thinking budget allows the model to "reason" about the image details before searching
        thinkingConfig: { thinkingBudget: 2048 }, 
      }
    });

    const responseText = response.text?.trim();
    if (!responseText) throw new Error("No response from AI");

    // Extract JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        console.error("Invalid AI Output:", responseText);
        throw new Error("AI could not identify the item structurally.");
    }

    let data: AutoIdentifiedItem;
    try {
        data = JSON.parse(jsonMatch[0]) as AutoIdentifiedItem;
    } catch (e) {
        throw new Error("Failed to parse AI response.");
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

  } catch (error) {
    console.error("Error identifying item:", error);
    throw new Error("Failed to identify item. Please try again.");
  }
};