import redis from "../config/redis";
import { getDocument } from "pdfjs-dist";
const { GoogleGenerativeAI } = require("@google/generative-ai");
const AI_MODEL = "gemini-pro";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const extractTextFromPDF = async (fileKey: string) => {
  try {
    const fileData = await redis.get(fileKey);
    if (!fileData) {
      throw new Error("File not found");
    }
    let fileBuffer: Uint8Array;
    if (Buffer.isBuffer(fileData)) {
      fileBuffer = new Uint8Array(fileData);
    } else if (typeof fileData == "object" && fileData !== null) {
      // check if the object has the expected structure
      const bufferData = fileData as { type?: string; data?: number[] };
      if (bufferData.type == "Buffer" && Array.isArray(bufferData.data)) {
        fileBuffer = new Uint8Array(bufferData.data);
      } else {
        throw new Error("Invalid file data");
      }
    } else {
      throw new Error("Invalid file data");
    }

    const pdf = await getDocument({ data: fileBuffer }).promise;
    let text = "";

    for (let i = 0; i < pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ");
    }
    return text;
  } catch (error) {
    console.log(error);
    throw new Error(
      "Failed to extract text from PDF. Error: " + JSON.stringify(error)
    );
  }
};

export const detectContractType = async (
  contractText: string
): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: AI_MODEL });
  const prompt = `
    Analyze the following contract text and determine the type of contract it is.Provide only the contract type as a string string (e.g., "Employment","Non-Disclosure Agreement", "Sales","Lease",etc.). Do not include any additional explanation or text.

    Contract text:
    ${contractText.substring(0,1000)}
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
};
