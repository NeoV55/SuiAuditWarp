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
        // Get all audit reports for dashboard
        const allReports = await storage.getAllAuditReports();
        return res.json(allReports);
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
      if (!validatedData.auditReportId) {
        return res.status(400).json({ error: "Audit report ID is required" });
      }
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

  // Authentic Walrus testnet deployment
  app.post("/api/walrus/deploy", async (req: Request, res: Response) => {
    try {
      let fileData: Buffer;
      
      if (Buffer.isBuffer(req.body)) {
        fileData = req.body;
      } else if (req.body instanceof Uint8Array) {
        fileData = Buffer.from(req.body);
      } else {
        return res.status(400).json({ error: "Invalid file data format" });
      }
      
      const storageEpochs = parseInt(req.headers['x-storage-epochs'] as string) || 10;
      const walletAddress = req.headers['x-wallet-address'] as string;
      
      if (!walletAddress) {
        return res.status(400).json({ error: "Sui wallet address required for deployment" });
      }
      
      if (!fileData || fileData.length === 0) {
        return res.status(400).json({ error: "File data required for deployment" });
      }
      
      const fileSizeKB = fileData.length / 1024;
      const fileSizeMB = fileData.length / (1024 * 1024);
      
      if (fileSizeMB > 50) {
        return res.status(400).json({ error: "File size exceeds 50MB limit" });
      }
      
      console.log(`Deploying to authentic Walrus testnet: ${fileSizeKB.toFixed(1)} KB for ${storageEpochs} epochs`);
      
      // Use authentic Walrus testnet client
      const { deployToWalrusTestnet } = await import('./walrusClient');
      
      const deploymentResult = await deployToWalrusTestnet(fileData, storageEpochs);
      
      return res.json({
        blobId: deploymentResult.blobId,
        transactionHash: deploymentResult.objectId,
        cost: deploymentResult.cost,
        storageEpochs: deploymentResult.storageEpochs,
        expirationEpoch: deploymentResult.expirationEpoch,
        deploymentStatus: "confirmed",
        walletAddress,
        fileSize: deploymentResult.fileSize,
        encodingType: deploymentResult.encodingType
      });
      
    } catch (error) {
      console.error("Walrus deployment error:", error);
      return res.status(500).json({ 
        error: "Deployment failed", 
        message: (error as Error).message 
      });
    }
  });

  // Legacy upload endpoint for backward compatibility
  app.put("/api/walrus/upload", async (req: Request, res: Response) => {
    // Official Walrus testnet publishers for failover
    const publishers = [
      "https://publisher.walrus-testnet.walrus.space",
      "https://wal-publisher-testnet.staketab.org", 
      "https://walrus-testnet-publisher.redundex.com",
      "https://walrus-testnet-publisher.nodes.guru",
      "https://walrus-testnet-publisher.stakin-nodes.com"
    ];
    
    for (let publisherIndex = 0; publisherIndex < publishers.length; publisherIndex++) {
      const publisher = publishers[publisherIndex];
      console.log(`Attempting upload to publisher ${publisherIndex + 1}/${publishers.length}: ${publisher}`);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout per publisher

        const response = await fetch(`${publisher}/v1/blobs`, {
          method: "PUT",
          body: req.body,
          headers: {
            "Content-Type": "application/octet-stream",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          console.log(`Walrus upload successful via ${publisher}: ${result.newlyCreated?.blobObject?.blobId || result.alreadyCertified?.blobId}`);
          return res.json(result);
        } else {
          console.log(`Publisher ${publisher} responded with status ${response.status}: ${response.statusText}`);
          // Try next publisher on any error
          continue;
        }
      } catch (error) {
        console.log(`Publisher ${publisher} failed:`, (error as Error).message);
        // Try next publisher
        continue;
      }
    }
    
    // All publishers failed
    console.error("All Walrus publishers failed");
    return res.status(503).json({ 
      error: "Walrus network temporarily unavailable", 
      code: "WALRUS_ALL_PUBLISHERS_FAILED",
      message: "All Walrus testnet publishers are currently experiencing issues. Please try again later."
    });
  });

  app.get("/api/walrus/blob/:blobId", async (req: Request, res: Response) => {
    const { blobId } = req.params;
    
    // Official Walrus testnet aggregators for failover
    const aggregators = [
      "https://aggregator.walrus-testnet.walrus.space",
      "https://wal-aggregator-testnet.staketab.org",
      "https://walrus-testnet-aggregator.redundex.com",
      "https://walrus-testnet.blockscope.net"
    ];
    
    let propagationAttempts = 0;
    const maxPropagationAttempts = 3;
    const propagationDelay = 5000; // 5 seconds between attempts
    
    while (propagationAttempts < maxPropagationAttempts) {
      for (const aggregator of aggregators) {
        try {
          const response = await fetch(`${aggregator}/v1/blobs/${blobId}`, {
            signal: AbortSignal.timeout(10000) // 10 second timeout per aggregator
          });
          
          if (response.ok) {
            const contentType = response.headers.get('Content-Type') || 'application/pdf';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `inline; filename="audit-report-${blobId}.pdf"`);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            const buffer = await response.arrayBuffer();
            return res.send(Buffer.from(buffer));
          }
        } catch (error) {
          console.log(`Aggregator ${aggregator} failed, trying next...`);
          continue;
        }
      }
      
      propagationAttempts++;
      if (propagationAttempts < maxPropagationAttempts) {
        console.log(`Blob ${blobId} not yet propagated, waiting ${propagationDelay}ms before retry ${propagationAttempts + 1}/${maxPropagationAttempts}`);
        await new Promise(resolve => setTimeout(resolve, propagationDelay));
      }
    }
    
    console.error("Blob not found after propagation attempts:", blobId);
    res.status(404).json({ 
      error: "Blob not found", 
      message: "Blob may still be propagating across the network. Please try again in a few minutes." 
    });
  });

  // Walrus deployment cost estimation
  app.post("/api/walrus/estimate-deployment", async (req: Request, res: Response) => {
    try {
      const { fileSizeBytes, storageEpochs = 10 } = req.body;
      
      if (!fileSizeBytes || fileSizeBytes <= 0) {
        return res.status(400).json({ error: "Invalid file size" });
      }
      
      // Walrus pricing calculation based on testnet rates
      const sizeInMB = fileSizeBytes / (1024 * 1024);
      const storageCostPerMBPerEpoch = 0.01; // SUI per MB per epoch
      const gasCost = 0.001; // Base gas cost in SUI
      
      const storageCost = sizeInMB * storageCostPerMBPerEpoch * storageEpochs;
      const totalCost = storageCost + gasCost;
      
      // Mock current epoch for estimation (in real implementation, fetch from Sui network)
      const currentEpoch = 1000;
      const expirationEpoch = currentEpoch + storageEpochs;
      
      return res.json({
        estimatedCost: Math.ceil(totalCost * 1000) / 1000, // Round to 3 decimals
        breakdown: {
          storageCost: Math.ceil(storageCost * 1000) / 1000,
          gasCost,
          totalCost: Math.ceil(totalCost * 1000) / 1000
        },
        epochs: {
          storage: storageEpochs,
          current: currentEpoch,
          expiration: expirationEpoch
        }
      });
    } catch (error) {
      console.error("Cost estimation error:", error);
      return res.status(500).json({ error: "Failed to estimate deployment cost" });
    }
  });

  // Walrus deployment status tracking
  app.get("/api/walrus/deployment-status/:blobId", async (req: Request, res: Response) => {
    try {
      const { blobId } = req.params;
      
      // Check if blob exists on Walrus network
      const aggregators = [
        "https://aggregator.walrus-testnet.walrus.space",
        "https://wal-aggregator-testnet.staketab.org",
        "https://walrus-testnet-aggregator.redundex.com",
        "https://walrus-testnet.blockscope.net"
      ];
      
      for (const aggregator of aggregators) {
        try {
          const response = await fetch(`${aggregator}/v1/blobs/${blobId}`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
          });
          
          if (response.ok) {
            return res.json({
              status: 'confirmed',
              blobId,
              aggregator,
              available: true,
              currentEpoch: 1000, // Mock epoch
              expirationEpoch: 1010 // Mock expiration
            });
          }
        } catch (error) {
          continue;
        }
      }
      
      return res.json({
        status: 'pending',
        blobId,
        available: false,
        message: 'Blob may still be propagating across the network'
      });
    } catch (error) {
      console.error("Deployment status error:", error);
      return res.status(500).json({ error: "Failed to check deployment status" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
