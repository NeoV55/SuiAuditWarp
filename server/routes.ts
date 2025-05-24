import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAuditReportSchema, 
  insertNftCertificateSchema, 
  insertBridgeTransactionSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for audit reports
  app.get("/api/audit-reports", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      if (userId) {
        const reports = await storage.getAuditReportsByUser(userId);
        return res.json(reports);
      } else {
        // This would need pagination in a production app
        const reports = await storage.getAuditReportsByUser(1); // Default to user 1 for demo
        return res.json(reports);
      }
    } catch (error) {
      console.error("Error fetching audit reports:", error);
      return res.status(500).json({ error: "Failed to fetch audit reports" });
    }
  });

  app.get("/api/audit-reports/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.getAuditReport(id);
      
      if (!report) {
        return res.status(404).json({ error: "Audit report not found" });
      }
      
      return res.json(report);
    } catch (error) {
      console.error("Error fetching audit report:", error);
      return res.status(500).json({ error: "Failed to fetch audit report" });
    }
  });

  app.post("/api/audit-reports", async (req: Request, res: Response) => {
    try {
      const validatedData = insertAuditReportSchema.parse(req.body);
      const report = await storage.createAuditReport(validatedData);
      return res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating audit report:", error);
      return res.status(500).json({ error: "Failed to create audit report" });
    }
  });

  app.put("/api/audit-reports/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      // Partial validation for updates
      const validatedData = insertAuditReportSchema.partial().parse(req.body);
      const updatedReport = await storage.updateAuditReport(id, validatedData);
      
      if (!updatedReport) {
        return res.status(404).json({ error: "Audit report not found" });
      }
      
      return res.json(updatedReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating audit report:", error);
      return res.status(500).json({ error: "Failed to update audit report" });
    }
  });

  // API routes for NFT certificates
  app.get("/api/nft-certificates", async (req: Request, res: Response) => {
    try {
      const auditReportId = req.query.auditReportId ? parseInt(req.query.auditReportId as string) : undefined;
      
      if (auditReportId) {
        const certificates = await storage.getNftCertificatesByAuditReport(auditReportId);
        return res.json(certificates);
      } else {
        return res.status(400).json({ error: "auditReportId query parameter is required" });
      }
    } catch (error) {
      console.error("Error fetching NFT certificates:", error);
      return res.status(500).json({ error: "Failed to fetch NFT certificates" });
    }
  });

  app.post("/api/nft-certificates", async (req: Request, res: Response) => {
    try {
      const validatedData = insertNftCertificateSchema.parse(req.body);
      const certificate = await storage.createNftCertificate(validatedData);
      return res.status(201).json(certificate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating NFT certificate:", error);
      return res.status(500).json({ error: "Failed to create NFT certificate" });
    }
  });

  // API routes for bridge transactions
  app.get("/api/bridge-transactions", async (req: Request, res: Response) => {
    try {
      const auditReportId = req.query.auditReportId ? parseInt(req.query.auditReportId as string) : undefined;
      
      if (auditReportId) {
        const transactions = await storage.getBridgeTransactionsByAuditReport(auditReportId);
        return res.json(transactions);
      } else {
        return res.status(400).json({ error: "auditReportId query parameter is required" });
      }
    } catch (error) {
      console.error("Error fetching bridge transactions:", error);
      return res.status(500).json({ error: "Failed to fetch bridge transactions" });
    }
  });

  app.post("/api/bridge-transactions", async (req: Request, res: Response) => {
    try {
      const validatedData = insertBridgeTransactionSchema.parse(req.body);
      
      // Check if audit report exists before creating bridge transaction
      const auditReport = await storage.getAuditReport(validatedData.auditReportId);
      if (!auditReport) {
        return res.status(400).json({ error: "Audit report not found" });
      }
      
      const transaction = await storage.createBridgeTransaction(validatedData);
      return res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating bridge transaction:", error);
      return res.status(500).json({ error: "Failed to create bridge transaction" });
    }
  });

  app.put("/api/bridge-transactions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      // Partial validation for updates
      const validatedData = insertBridgeTransactionSchema.partial().parse(req.body);
      const updatedTransaction = await storage.updateBridgeTransaction(id, validatedData);
      
      if (!updatedTransaction) {
        return res.status(404).json({ error: "Bridge transaction not found" });
      }
      
      return res.json(updatedTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating bridge transaction:", error);
      return res.status(500).json({ error: "Failed to update bridge transaction" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
