import { 
  users, auditReports, nftCertificates, bridgeTransactions,
  type User, type InsertUser,
  type AuditReport, type InsertAuditReport,
  type NftCertificate, type InsertNftCertificate,
  type BridgeTransaction, type InsertBridgeTransaction
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Audit report operations
  getAuditReport(id: number): Promise<AuditReport | undefined>;
  getAuditReportsByUser(userId: number): Promise<AuditReport[]>;
  getAllAuditReports(): Promise<AuditReport[]>;
  createAuditReport(report: InsertAuditReport): Promise<AuditReport>;
  updateAuditReport(id: number, updates: Partial<InsertAuditReport>): Promise<AuditReport | undefined>;
  
  // NFT certificate operations
  getNftCertificate(id: number): Promise<NftCertificate | undefined>;
  getNftCertificatesByAuditReport(auditReportId: number): Promise<NftCertificate[]>;
  createNftCertificate(certificate: InsertNftCertificate): Promise<NftCertificate>;
  
  // Bridge transaction operations
  getBridgeTransaction(id: number): Promise<BridgeTransaction | undefined>;
  getBridgeTransactionsByAuditReport(auditReportId: number): Promise<BridgeTransaction[]>;
  createBridgeTransaction(transaction: InsertBridgeTransaction): Promise<BridgeTransaction>;
  updateBridgeTransaction(id: number, updates: Partial<InsertBridgeTransaction>): Promise<BridgeTransaction | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Audit report operations
  async getAuditReport(id: number): Promise<AuditReport | undefined> {
    const [report] = await db.select().from(auditReports).where(eq(auditReports.id, id));
    return report;
  }
  
  async getAuditReportsByUser(userId: number): Promise<AuditReport[]> {
    return db.select().from(auditReports).where(eq(auditReports.userId, userId));
  }

  async getAllAuditReports(): Promise<AuditReport[]> {
    try {
      const reports = await db.select({
        id: auditReports.id,
        userId: auditReports.userId,
        contractName: auditReports.contractName,
        contractCode: auditReports.contractCode,
        blockchain: auditReports.blockchain,
        auditResult: auditReports.auditResult,
        vulnerabilityScore: auditReports.vulnerabilityScore,
        ipfsHash: auditReports.ipfsHash,
        pdfUrl: auditReports.pdfUrl,
        walrusMetadata: auditReports.walrusMetadata,
        createdAt: auditReports.createdAt,
        user: {
          id: users.id,
          username: users.username
        }
      })
      .from(auditReports)
      .leftJoin(users, eq(auditReports.userId, users.id))
      .orderBy(desc(auditReports.createdAt))
      .limit(50);
      
      return reports.map(report => ({
        ...report,
        user: report.user && report.user.id ? { 
          id: report.user.id, 
          username: report.user.username || 'Unknown' 
        } : undefined
      })) as AuditReport[];
    } catch (error) {
      console.error("Error fetching all audit reports:", error);
      return [];
    }
  }
  
  async createAuditReport(report: InsertAuditReport): Promise<AuditReport> {
    const [newReport] = await db
      .insert(auditReports)
      .values(report)
      .returning();
    return newReport;
  }
  
  async updateAuditReport(id: number, updates: Partial<InsertAuditReport>): Promise<AuditReport | undefined> {
    const [updatedReport] = await db
      .update(auditReports)
      .set(updates)
      .where(eq(auditReports.id, id))
      .returning();
    return updatedReport;
  }
  
  // NFT certificate operations
  async getNftCertificate(id: number): Promise<NftCertificate | undefined> {
    const [certificate] = await db.select().from(nftCertificates).where(eq(nftCertificates.id, id));
    return certificate;
  }
  
  async getNftCertificatesByAuditReport(auditReportId: number): Promise<NftCertificate[]> {
    return db.select().from(nftCertificates).where(eq(nftCertificates.auditReportId, auditReportId));
  }
  
  async createNftCertificate(certificate: InsertNftCertificate): Promise<NftCertificate> {
    const [newCertificate] = await db
      .insert(nftCertificates)
      .values(certificate)
      .returning();
    return newCertificate;
  }
  
  // Bridge transaction operations
  async getBridgeTransaction(id: number): Promise<BridgeTransaction | undefined> {
    const [transaction] = await db.select().from(bridgeTransactions).where(eq(bridgeTransactions.id, id));
    return transaction;
  }
  
  async getBridgeTransactionsByAuditReport(auditReportId: number): Promise<BridgeTransaction[]> {
    return db.select().from(bridgeTransactions).where(eq(bridgeTransactions.auditReportId, auditReportId));
  }
  
  async createBridgeTransaction(transaction: InsertBridgeTransaction): Promise<BridgeTransaction> {
    const [newTransaction] = await db
      .insert(bridgeTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }
  
  async updateBridgeTransaction(id: number, updates: Partial<InsertBridgeTransaction>): Promise<BridgeTransaction | undefined> {
    const [updatedTransaction] = await db
      .update(bridgeTransactions)
      .set(updates)
      .where(eq(bridgeTransactions.id, id))
      .returning();
    return updatedTransaction;
  }
}

export const storage = new DatabaseStorage();
