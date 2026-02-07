import { GoogleGenAI, Type } from "@google/genai";
import { BoundingBox } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using gemini-2.5-flash-latest for multimodal vision capabilities
const MODEL_NAME = "gemini-2.5-flash-latest";

export const detectObjectsInImage = async (base64Image: string): Promise<BoundingBox[]> => {
  try {
    const prompt = `
      Analyze the image and detect all distinct trading cards, stickers, or isolated character items.
      Return a list of bounding boxes for each individual item found.
      Be precise with the edges. Exclude the background.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png", // Assuming PNG or standard image type, API handles most
              data: base64Image,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            boundingBoxes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ymin: { type: Type.NUMBER, description: "Top Y coordinate (0-1000)" },
                  xmin: { type: Type.NUMBER, description: "Left X coordinate (0-1000)" },
                  ymax: { type: Type.NUMBER, description: "Bottom Y coordinate (0-1000)" },
                  xmax: { type: Type.NUMBER, description: "Right X coordinate (0-1000)" },
                },
                required: ["ymin", "xmin", "ymax", "xmax"],
              },
            },
          },
        },
      },
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(response.text);
    return result.boundingBoxes || [];
  } catch (error) {
    console.error("Error detecting objects:", error);
    throw error;
  }
};