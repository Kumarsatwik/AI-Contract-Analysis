import multer from "multer";
import { IUser } from "../models/user.model";
import { Request, Response } from "express";
import redis from "../config/redis";
import {
  detectContractType,
  extractTextFromPDF,
} from "../services/ai.services";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "application/pdf") {
      cb(null, true);
    } else {
      cb(null, false);
      cb(new Error("Only .pdf format allowed!"));
    }
  },
}).single("contract");

export const uploadMiddleware = upload;

export const detectAndConfirmContractType = async (
  req: Request,
  res: Response
) => {
  const user = req.user as IUser;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  try {
    const fileKey = `file:${user._id}:${Date.now()}`;
    await redis.set(fileKey, req.file.buffer);

    await redis.expire(fileKey, 3600);

    const pdfText = await extractTextFromPDF(fileKey);
    const detectedType = await detectContractType(pdfText);

    await redis.del(fileKey);

    res.json({ detectedType });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: "Failed to detect contract type" });
  }
};


