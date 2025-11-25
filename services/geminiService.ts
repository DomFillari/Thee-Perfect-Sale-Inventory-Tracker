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

    // The Ultimate "Reverse Image Search" Simulation Prompt
    const prompt = `
      You are an advanced Visual Search Engine. Your goal is to replicate the behavior of a Reverse Image Search using visual analysis.
      
      PHASE 1: VISUAL FINGERPRINTING (Internal Thought Process)
      1.  Scan the image for ANY text, logos, or serial numbers. If found, these are your primary search keys.
      2.  If NO text is found, construct a "Visual Fingerprint" description.
          *   Describe unique shapes (e.g., "bulbous bottom, long neck").
          *   Describe materials/textures (e.g., "hammered copper", "crackled glaze").
          *   Describe artistic styles (e.g., "Art Deco geometric", "Victorian floral").
          *   Describe distinct markings (e.g., "blue crossed swords mark").
      
      PHASE 2: REVERSE SEARCH EXECUTION
      1.  Use the 'googleSearch' tool. 
      2.  Construct a search query that combines your Visual Fingerprint with terms like "sold price", "vintage", "antique", "value", or "maker".
          *   Example Query: "vintage green glass vase bubbles base pontil mark value"
          *   Example Query: "antique bronze sculpture dancer signed DH chiparus"
      3.  Look for "Sold Listings" or "Collector Guides" to identify the exact item.
      
      PHASE 3: AI OVERVIEW GENERATION
      1.  Identify the item specifically.
      2.  Write a "Google Lens Style" AI Overview in the 'description' field.
          *   Start with "AI Overview: ".
          *   Summarize the Item, Era, Maker, and Collectibility.
      3.  Estimate the price based on the search results.

      RETURN JSON ONLY:
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
      model: 'gemini-3-pro-preview', // Strongest model for visual reasoning
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        tools: [{ googleSearch: {} }], 
        // 10k token budget to allow for detailed "Visual Fingerprinting" and search synthesis
        thinkingConfig: { thinkingBudget: 10240 }, 
      }
    });

    const responseText = response.text?.trim();
    if (!responseText) throw new Error("No response from AI");

    // Robust JSON extraction
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
        console.error("Invalid AI Output:", responseText);
        throw new Error("AI could not generate the Overview.");
    }

    const jsonString = responseText.substring(jsonStart, jsonEnd + 1);

    let data: AutoIdentifiedItem;
    try {
        data = JSON.parse(jsonString) as AutoIdentifiedItem;
    } catch (e) {
        console.error("JSON Parse Error", e);
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

  } catch (error) {
    console.error("Error identifying item:", error);
    throw new Error("Failed to get AI Overview. Please try again.");
  }
};