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

    // Prompt optimized to prioritize OCR (Reading Text) which is the "Secret Sauce" of Google Lens
    const prompt = `
      You are an expert inventory specialist with "Google Lens"-like capabilities.
      Your task is to identify this item with high precision using the 'googleSearch' tool.

      CRITICAL PROCESS - DO NOT SKIP STEPS:
      
      1. **READ TEXT FIRST (OCR)**: 
         - Scan the image for ANY text, numbers, model codes, serial numbers, or brand logos.
         - If found, use these EXACT alphanumeric strings as your primary search queries. 
         - *Example*: If you see "Sony KV-2000", search for that. Do not just search for "TV".
         - This is how Google Lens works; it prioritizes specific identifiers over general shapes.
      
      2. **VISUAL ANALYSIS**: 
         - If NO text is clear, perform a deep visual analysis.
         - Identify the era (Art Deco, Mid-Century), material (Teak, Porcelain, Bakelite), and specific style.
         - Use these detailed visual descriptors for your search.

      3. **MARKET RESEARCH**: 
         - Use the search results to find "Sold" listings or catalog entries.
         - Estimate the price based on current market value.

      4. **FALLBACK**: 
         - If search returns nothing, use your internal knowledge base to provide your best educated estimate for Name, Description, and Details. DO NOT return "Unknown" if you can guess.

      RETURN JSON ONLY in this format:
      {
        "name": "Detailed Item Name (Brand + Model)",
        "maker": "Brand/Artist (or 'Unmarked')",
        "description": "Professional sales description including features, era, dimensions estimate, and condition notes.",
        "category": "Apparel | Home Goods | Electronics | Collectibles | Other",
        "condition": "Visual assessment (e.g. 'Good Vintage Condition')",
        "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
        "price": 0.00
      }
      
      Note: 'price' must be a number (no currency symbols). If absolutely unknown, return null.
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
