import { pgTable, text, serial, integer, boolean, timestamp, varchar, doublePrecision, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User accounts
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  walletAddress: text("wallet_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit reports
export const auditReports = pgTable("audit_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  contractName: text("contract_name").notNull(),
  contractCode: text("contract_code").notNull(),
  blockchain: text("blockchain").notNull(),
  auditResult: text("audit_result"),
  vulnerabilityScore: doublePrecision("vulnerability_score"),
  ipfsHash: text("ipfs_hash"),
  pdfUrl: text("pdf_url"),
  walrusMetadata: json("walrus_metadata"), // Added walrus metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// NFT certificates
export const nftCertificates = pgTable("nft_certificates", {
  id: serial("id").primaryKey(),
  auditReportId: integer("audit_report_id").notNull().references(() => auditReports.id),
  mintTxHash: text("mint_tx_hash"),
  nftObjectId: text("nft_object_id"),
  ownerAddress: text("owner_address").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cross-chain transactions
export const bridgeTransactions = pgTable("bridge_transactions", {
  id: serial("id").primaryKey(),
  auditReportId: integer("audit_report_id").notNull().references(() => auditReports.id),
  sourceChain: text("source_chain").notNull(),
  destChain: text("dest_chain").notNull(),
  sourceTxHash: text("source_tx_hash"),
  ethAmount: text("eth_amount"),
  status: text("status").notNull().default("pending"),
  vaaId: text("vaa_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  auditReports: many(auditReports),
}));

export const auditReportsRelations = relations(auditReports, ({ one, many }) => ({
  user: one(users, {
    fields: [auditReports.userId],
    references: [users.id],
  }),
  nftCertificates: many(nftCertificates),
  bridgeTransactions: many(bridgeTransactions),
}));

export const nftCertificatesRelations = relations(nftCertificates, ({ one }) => ({
  auditReport: one(auditReports, {
    fields: [nftCertificates.auditReportId],
    references: [auditReports.id],
  }),
}));

export const bridgeTransactionsRelations = relations(bridgeTransactions, ({ one }) => ({
  auditReport: one(auditReports, {
    fields: [bridgeTransactions.auditReportId],
    references: [auditReports.id],
  }),
}));

// Create insertion schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  walletAddress: true,
});

export const insertAuditReportSchema = createInsertSchema(auditReports).pick({
  userId: true,
  contractName: true,
  contractCode: true,
  blockchain: true,
  auditResult: true,
  vulnerabilityScore: true,
  ipfsHash: true,
  pdfUrl: true,
});

export const insertNftCertificateSchema = createInsertSchema(nftCertificates).pick({
  auditReportId: true,
  mintTxHash: true,
  nftObjectId: true,
  ownerAddress: true,
});

export const insertBridgeTransactionSchema = createInsertSchema(bridgeTransactions).pick({
  auditReportId: true,
  sourceChain: true,
  destChain: true,
  sourceTxHash: true,
  ethAmount: true,
  status: true,
  vaaId: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAuditReport = z.infer<typeof insertAuditReportSchema>;
export type AuditReport = typeof auditReports.$inferSelect;

export type InsertNftCertificate = z.infer<typeof insertNftCertificateSchema>;
export type NftCertificate = typeof nftCertificates.$inferSelect;

export type InsertBridgeTransaction = z.infer<typeof insertBridgeTransactionSchema>;
export type BridgeTransaction = typeof bridgeTransactions.$inferSelect;