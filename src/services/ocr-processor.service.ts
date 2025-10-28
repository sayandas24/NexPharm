// OCR Processor Service using Tesseract.js

import { createWorker, Worker } from "tesseract.js";
import { OCRResult, OCRErrorType } from "@/types/scanner-types";
import { preprocessImageForOCR } from "@/utils/image-processing.utils";
import { cleanOCRText } from "@/utils/text-matching.utils";

class OCRProcessorService {
  private worker: Worker | null = null;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize Tesseract worker
   */
  async initialize(): Promise<void> {
    // Return existing initialization promise if already initializing
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return immediately if already initialized
    if (this.isInitialized && this.worker) {
      return Promise.resolve();
    }

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log("Initializing Tesseract worker...");

      // Create worker
      this.worker = await createWorker("eng", 1, {
        logger: (m) => {
          // Log progress for debugging
          if (m.status === "recognizing text") {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      this.isInitialized = true;
      console.log("Tesseract worker initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Tesseract worker:", error);
      this.isInitialized = false;
      this.worker = null;
      throw new Error(OCRErrorType.INITIALIZATION_FAILED);
    } finally {
      this.initializationPromise = null;
    }
  }

  /**
   * Process image and extract text using OCR
   */
  async processImage(imageData: string): Promise<OCRResult> {
    // Ensure worker is initialized
    if (!this.isInitialized || !this.worker) {
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error(OCRErrorType.INITIALIZATION_FAILED);
    }

    try {
      console.log("Pre-processing image for OCR...");
      // Pre-process image for better accuracy
      const processedImage = await preprocessImageForOCR(imageData);

      console.log("Running OCR...");
      // Run OCR with timeout
      const result = await Promise.race([
        this.worker.recognize(processedImage),
        this._timeout(10000), // 10 second timeout
      ]);

      if (!result) {
        throw new Error(OCRErrorType.PROCESSING_FAILED);
      }

      // Extract text and confidence
      const text = result.data.text.trim();
      const confidence = result.data.confidence;

      console.log(`OCR completed. Confidence: ${confidence}%`);
      console.log("Extracted text:", text);

      // Check if text was detected
      if (!text || text.length < 3) {
        throw new Error(OCRErrorType.NO_TEXT_DETECTED);
      }

      // Clean the extracted text
      const cleanedText = cleanOCRText(text);

      // Extract words with confidence scores (if available)
      const words = [];
      const resultData = result.data as any;
      if (resultData.words && Array.isArray(resultData.words)) {
        for (const word of resultData.words) {
          words.push({
            text: word.text,
            confidence: word.confidence,
            bbox: {
              x0: word.bbox.x0,
              y0: word.bbox.y0,
              x1: word.bbox.x1,
              y1: word.bbox.y1,
            },
          });
        }
      }

      return {
        text: cleanedText,
        confidence,
        words,
      };
    } catch (error) {
      console.error("OCR processing error:", error);

      const err = error as Error;
      
      // Handle specific error types
      if (err.message === OCRErrorType.NO_TEXT_DETECTED) {
        throw error;
      }

      if (err.message === "timeout") {
        throw new Error(OCRErrorType.PROCESSING_FAILED);
      }

      throw new Error(OCRErrorType.PROCESSING_FAILED);
    }
  }

  /**
   * Terminate worker and cleanup resources
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      try {
        await this.worker.terminate();
        console.log("Tesseract worker terminated");
      } catch (error) {
        console.error("Error terminating worker:", error);
      } finally {
        this.worker = null;
        this.isInitialized = false;
      }
    }
  }

  /**
   * Helper function to create timeout promise
   */
  private _timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error("timeout")), ms);
    });
  }

  /**
   * Check if worker is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.worker !== null;
  }
}

// Export singleton instance
export const ocrProcessor = new OCRProcessorService();
