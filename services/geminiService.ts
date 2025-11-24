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

    const prompt = `
      Act as an expert reseller. Analyze the image and identify the item.
      1. Provide a concise but descriptive Name (including brand/model if visible).
      2. Identify the Maker/Brand.
      3. Write a detailed sales Description highlighting key features, materials, and visual condition.
      4. Categorize it into one of these exact categories: 'Apparel', 'Home Goods', 'Electronics', 'Collectibles', 'Other'.
      5. Suggest 5 search tags.
      6. Estimate visual condition ('New', 'Like New', 'Good', 'Fair', 'Poor').
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