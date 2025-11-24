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

    // Improved prompt for handling real-world warehouse photos AND vintage/art/trinkets
    const prompt = `
      You are an expert appraiser, art historian, and inventory specialist with deep knowledge of antiques, collectibles, and modern goods.
      Analyze this image of a warehouse item to identify it for resale.

      The item could be anything from a modern appliance with a barcode to a vintage sculpture, painting, or unmarked antique trinket.

      CRITICAL IDENTIFICATION STRATEGY:
      1. **TEXT & LABELS (First Priority)**: If there is visible text, brand names, model numbers, or serial numbers, use them to identify the item precisely (e.g., "KitchenAid Artisan Mixer", "Sony PlayStation 5").
      2. **VISUAL ANALYSIS (for Art/Antiques/Trinkets)**: If there is NO text, analyze the visual characteristics like an appraiser:
         - **Style/Period**: Identify styles like Art Deco, Mid-Century Modern, Victorian, Impressionist, Tribal, etc.
         - **Material**: Identify materials like bronze, porcelain (e.g., Lladro, Hummel), Murano glass, mahogany, sterling silver, cloisonné.
         - **Subject**: Describe what is depicted (e.g., "Sculpture of a dancing ballerina", "Oil painting of a pastoral landscape", "Brass candlestick holder").
         - **Marks**: Look for artist signatures, hallmarks, or maker's marks on the bottom or back if visible.
      3. **Ignore Background**: The item is in a warehouse. Ignore shelves, concrete floors, and boxes in the background. Focus on the main object.

      OUTPUT REQUIREMENTS:
      - **Name**: Be specific. "Vintage 1970s Murano Glass Clown" is better than "Glass Figure". Include Era/Style if brand is unknown.
      - **Maker**: If unknown, infer from style (e.g., "In the style of Dali") or put "Unmarked [Era/Style]" or "Vintage".
      - **Description**: Describe it like an auction listing. Mention age, material, origin, and key artistic features.
      - **Condition**: Visually estimate.

      Output a JSON object with:
      1. name: Specific title (Brand + Model OR Style + Object).
      2. maker: Brand or Artist or "Unmarked".
      3. description: Detailed sales description (2-3 sentences).
      4. category: One of ['Apparel', 'Home Goods', 'Electronics', 'Collectibles', 'Other'].
      5. condition: Estimate ('New', 'Like New', 'Good', 'Fair', 'Poor').
      6. tags: 5-7 SEO keywords (including style, material, era, origin).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            maker: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            condition: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['name', 'description', 'category', 'tags']
        }
      }
    });

    const responseText = response.text?.trim();
    if (!responseText) throw new Error("No response from AI");

    const data = JSON.parse(responseText) as AutoIdentifiedItem;
    return data;

  } catch (error) {
    console.error("Error identifying item:", error);
    throw new Error("Failed to identify item. Please try again.");
  }
};