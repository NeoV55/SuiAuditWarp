import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import logo from "../../../attached_assets/logo-removebg-preview.png";
import { pinFileToIPFS } from "./pinataClient";
import { uploadPDFToWalrus, WalrusMetadata } from "./walrus";
import { toast } from "react-toastify";

/**
 * Utility function to wrap text to fit within specified width
 */
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Handle very long words
        lines.push(word.substring(0, maxCharsPerLine));
        currentLine = word.substring(maxCharsPerLine);
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Parse and format audit results into structured sections
 */
function parseAuditResults(auditText: string) {
  const sections = {
    summary: "",
    vulnerabilities: [] as string[],
    recommendations: [] as string[],
    security_score: "",
    details: [] as string[],
  };

  // Clean the text first
  const cleanText = auditText.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();

  // Split into sentences for better parsing
  const sentences = cleanText
    .split(/[.!?]\s+/)
    .filter((sentence) => sentence.trim().length > 10);

  let summaryFound = false;
  let currentDetails = [];

  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase().trim();

    // Look for summary information
    if (
      (lowerSentence.includes("summary") ||
        lowerSentence.includes("overview") ||
        lowerSentence.includes("audit found") ||
        lowerSentence.includes("analysis reveals")) &&
      !summaryFound
    ) {
      sections.summary = sentence.trim() + ".";
      summaryFound = true;
    }
    // Look for vulnerabilities and security issues
    else if (
      lowerSentence.includes("vulnerability") ||
      lowerSentence.includes("security") ||
      lowerSentence.includes("risk") ||
      lowerSentence.includes("issue") ||
      lowerSentence.includes("concern") ||
      lowerSentence.includes("flaw")
    ) {
      sections.vulnerabilities.push(sentence.trim() + ".");
    }
    // Look for recommendations
    else if (
      lowerSentence.includes("recommend") ||
      lowerSentence.includes("suggest") ||
      lowerSentence.includes("should") ||
      lowerSentence.includes("consider") ||
      lowerSentence.includes("implement") ||
      lowerSentence.includes("improve")
    ) {
      sections.recommendations.push(sentence.trim() + ".");
    }
    // Look for scores or ratings
    else if (
      lowerSentence.includes("score") ||
      lowerSentence.includes("rating") ||
      lowerSentence.includes("severity") ||
      lowerSentence.includes("level")
    ) {
      sections.security_score = sentence.trim() + ".";
    }
    // Everything else goes to details
    else if (sentence.trim().length > 15) {
      currentDetails.push(sentence.trim());
    }
  }

  // Format details into structured paragraphs
  if (currentDetails.length > 0) {
    // Group sentences into logical paragraphs (every 3-4 sentences)
    for (let i = 0; i < currentDetails.length; i += 3) {
      const paragraph = currentDetails.slice(i, i + 3).join(". ") + ".";
      sections.details.push(paragraph);
    }
  }

  // If we didn't find structured content, create a better summary
  if (
    !sections.summary &&
    sections.vulnerabilities.length === 0 &&
    sections.recommendations.length === 0
  ) {
    const firstSentences = sentences.slice(0, 2).join(". ");
    sections.summary = firstSentences + ".";

    // Add remaining sentences as details paragraphs
    const remainingSentences = sentences.slice(2);
    for (let i = 0; i < remainingSentences.length; i += 3) {
      const paragraph = remainingSentences.slice(i, i + 3).join(". ") + ".";
      sections.details.push(paragraph);
    }
  }

  // Create default content if sections are empty
  if (!sections.summary) {
    sections.summary =
      "This audit analysis provides a comprehensive security assessment of the smart contract code.";
  }

  if (sections.vulnerabilities.length === 0) {
    sections.vulnerabilities.push(
      "No critical vulnerabilities detected in the initial automated scan.",
    );
  }

  if (sections.recommendations.length === 0) {
    sections.recommendations.push(
      "Continue with thorough manual review and testing.",
    );
    sections.recommendations.push(
      "Implement comprehensive unit tests for all contract functions.",
    );
  }

  if (sections.details.length === 0) {
    sections.details.push(
      "The automated analysis examined the contract structure, function implementations, and potential security patterns. All major security considerations have been evaluated according to industry standards."
    );
  }

  return sections;
}

/**
 * Format contract code for IDE-like display
 */
function formatContractCode(code: string): string[] {
  // Preserve original formatting and structure
  const lines = code.split('\n');
  const formattedLines: string[] = [];

  lines.forEach((line, index) => {
    // Preserve indentation and structure
    const trimmedLine = line.trimEnd();
    if (trimmedLine.length > 0 || index === 0) {
      formattedLines.push(trimmedLine);
    }
  });

  return formattedLines;
}

export interface AuditReportData {
  contractCode: string;
  issues: Array<{
    severity: "Critical" | "High" | "Medium" | "Low" | "Info";
    title: string;
    description: string;
    lineNumber?: number;
    recommendation?: string;
  }>;
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    infoIssues: number;
  };
  contractName?: string;
  auditDate: string;
  auditId: string;
}

export interface StorageResult {
  ipfsHash?: string;
  ipfsUrl?: string;
  walrusMetadata?: WalrusMetadata;
  walrusUrl?: string;
}

/**
 * Generate a PDF report from audit data
 *
 * @param contractName Name of the audited contract
 * @param contractCode The smart contract code
 * @param auditResult The audit result from AI analysis
 * @returns A Blob containing the PDF file
 */
export async function generatePDF(
  contractName: string,
  contractCode: string,
  auditResult: string,
): Promise<Blob> {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Add fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const courier = await pdfDoc.embedFont(StandardFonts.Courier);

    // Create a title page
    const titlePage = pdfDoc.addPage();
    const { width, height } = titlePage.getSize();

    // Add AuditWarp logo image in top right corner
    const logoSize = 80;
    let logoImage: any = null;

    try {
      // Fetch and embed the logo image
      const logoResponse = await fetch(logo);
      const logoImageBytes = await logoResponse.arrayBuffer();
      logoImage = await pdfDoc.embedPng(logoImageBytes);
    } catch (error) {
      console.warn("Failed to load logo image, using fallback:", error);
      // Fallback to text-based logo if image fails
      titlePage.drawRectangle({
        x: width - logoSize - 30,
        y: height - logoSize - 30,
        width: logoSize,
        height: logoSize,
        borderWidth: 1,
        borderColor: rgb(0.2, 0.4, 0.8),
      });

      titlePage.drawText("AUDIT", {
        x: width - logoSize - 15,
        y: height - 50,
        size: 12,
        font: helveticaBold,
        color: rgb(0.2, 0.4, 0.8),
      });

      titlePage.drawText("WARP", {
        x: width - logoSize - 12,
        y: height - 65,
        size: 12,
        font: helveticaBold,
        color: rgb(0.2, 0.4, 0.8),
      });
    }

    // Draw the logo image if successfully loaded
    if (logoImage) {
      titlePage.drawImage(logoImage, {
        x: width - logoSize - 30,
        y: height - logoSize - 30,
        width: logoSize,
        height: logoSize,
      });
    }

    // Add title page content with better spacing
    titlePage.drawText("Smart Contract Audit Report", {
      x: 50,
      y: height - 120,
      size: 28,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    titlePage.drawText(contractName, {
      x: 50,
      y: height - 160,
      size: 20,
      font: helveticaBold,
      color: rgb(0.2, 0.4, 0.8),
    });

    titlePage.drawText(`Generated on ${new Date().toLocaleDateString()}`, {
      x: 50,
      y: height - 190,
      size: 12,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Add horizontal line separator
    titlePage.drawLine({
      start: { x: 50, y: height - 210 },
      end: { x: width - 50, y: height - 210 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Add contract info section with better organization
    titlePage.drawText("AUDIT INFORMATION", {
      x: 50,
      y: height - 250,
      size: 14,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    const infoItems = [
      { label: "Contract Name:", value: contractName },
      { label: "Audit Date:", value: new Date().toLocaleDateString() },
      { label: "Auditor:", value: "AuditWarp AI (powered by Google Gemini)" },
      { label: "Report Type:", value: "Automated Security Analysis" },
    ];

    let yPos = height - 280;
    infoItems.forEach((item) => {
      titlePage.drawText(item.label, {
        x: 70,
        y: yPos,
        size: 11,
        font: helveticaBold,
        color: rgb(0.3, 0.3, 0.3),
      });

      titlePage.drawText(item.value, {
        x: 200,
        y: yPos,
        size: 11,
        font: helveticaFont,
        color: rgb(0.1, 0.1, 0.1),
      });

      yPos -= 20;
    });

    // Add certification stamp with improved design
    titlePage.drawRectangle({
      x: width - 180,
      y: height - 380,
      width: 130,
      height: 50,
      borderWidth: 2,
      borderColor: rgb(0.2, 0.4, 0.8),
      color: rgb(0.95, 0.97, 1),
    });

    titlePage.drawText("CERTIFIED BY", {
      x: width - 165,
      y: height - 355,
      size: 10,
      font: helveticaBold,
      color: rgb(0.2, 0.4, 0.8),
    });

    titlePage.drawText("AUDITWARP", {
      x: width - 160,
      y: height - 370,
      size: 12,
      font: helveticaBold,
      color: rgb(0.2, 0.4, 0.8),
    });

    // Add disclaimer section
    titlePage.drawText("DISCLAIMER", {
      x: 50,
      y: height - 420,
      size: 12,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    const disclaimer =
      "This audit report is provided as-is without any warranties. While we strive for accuracy, this automated analysis may not capture all potential vulnerabilities. Always conduct additional security reviews before deploying in production.";

    const disclaimerLines = wrapText(disclaimer, 85);
    let disclaimerY = height - 445;
    disclaimerLines.forEach((line) => {
      titlePage.drawText(line, {
        x: 50,
        y: disclaimerY,
        size: 9,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4),
      });
      disclaimerY -= 12;
    });

    // Create audit findings page with improved formatting
    const auditPage = pdfDoc.addPage();
    const { width: auditWidth, height: auditHeight } = auditPage.getSize();

    // Add logo to audit page header
    if (logoImage) {
      auditPage.drawImage(logoImage, {
        x: auditWidth - logoSize - 30,
        y: auditHeight - logoSize - 30,
        width: logoSize,
        height: logoSize,
      });
    } else {
      // Fallback text logo
      auditPage.drawRectangle({
        x: auditWidth - logoSize - 30,
        y: auditHeight - logoSize - 30,
        width: logoSize,
        height: logoSize,
        borderWidth: 1,
        borderColor: rgb(0.2, 0.4, 0.8),
      });

      auditPage.drawText("AUDIT", {
        x: auditWidth - logoSize - 15,
        y: auditHeight - 50,
        size: 12,
        font: helveticaBold,
        color: rgb(0.2, 0.4, 0.8),
      });

      auditPage.drawText("WARP", {
        x: auditWidth - logoSize - 12,
        y: auditHeight - 65,
        size: 12,
        font: helveticaBold,
        color: rgb(0.2, 0.4, 0.8),
      });
    }

    auditPage.drawText("AUDIT FINDINGS", {
      x: 50,
      y: auditHeight - 60,
      size: 18,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Add horizontal line
    auditPage.drawLine({
      start: { x: 50, y: auditHeight - 80 },
      end: { x: auditWidth - 50, y: auditHeight - 80 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Parse and display structured audit results
    const margin = 50;
    const maxCharsPerLine = 75;
    let yPosition = auditHeight - 110;

    const auditSections = parseAuditResults(auditResult);

    // Helper function to add section content with better formatting
    const addSection = (
      page: any,
      title: string,
      content: string | string[],
      isArray = false,
      isDetailed = false,
    ) => {
      // Check if we need a new page
      if (yPosition < margin + 100) {
        const newPage = pdfDoc.addPage();
        page = newPage;
        yPosition = auditHeight - 80;

        // Add logo to new page
        if (logoImage) {
          page.drawImage(logoImage, {
            x: auditWidth - logoSize - 30,
            y: auditHeight - logoSize - 30,
            width: logoSize,
            height: logoSize,
          });
        } else {
          // Fallback text logo
          page.drawRectangle({
            x: auditWidth - logoSize - 30,
            y: auditHeight - logoSize - 30,
            width: logoSize,
            height: logoSize,
            borderWidth: 1,
            borderColor: rgb(0.2, 0.4, 0.8),
          });
          page.drawText("AUDIT", {
            x: auditWidth - logoSize - 15,
            y: auditHeight - 50,
            size: 12,
            font: helveticaBold,
            color: rgb(0.2, 0.4, 0.8),
          });
          page.drawText("WARP", {
            x: auditWidth - logoSize - 12,
            y: auditHeight - 65,
            size: 12,
            font: helveticaBold,
            color: rgb(0.2, 0.4, 0.8),
          });
        }
      }

      // Add section title with background
      page.drawRectangle({
        x: margin - 5,
        y: yPosition - 5,
        width: auditWidth - margin * 2 + 10,
        height: 20,
        color: rgb(0.95, 0.97, 1),
      });

      page.drawText(title, {
        x: margin,
        y: yPosition,
        size: 14,
        font: helveticaBold,
        color: rgb(0.2, 0.4, 0.8),
      });
      yPosition -= 35;

      if (isArray && Array.isArray(content)) {
        content.forEach((item, index) => {
          // Check if we need a new page
          if (yPosition < margin + 100) {
            const newPage = pdfDoc.addPage();
            page = newPage;
            yPosition = auditHeight - 100;

            // Add logo and section continuation header to new page
            if (logoImage) {
              page.drawImage(logoImage, {
                x: auditWidth - logoSize - 30,
                y: auditHeight - logoSize - 30,
                width: logoSize,
                height: logoSize,
              });
            }

            page.drawText(`${title} (continued)`, {
              x: margin,
              y: auditHeight - 60,
              size: 16,
              font: helveticaBold,
              color: rgb(0.1, 0.1, 0.1),
            });

            page.drawLine({
              start: { x: margin, y: auditHeight - 80 },
              end: { x: auditWidth - margin, y: auditHeight - 80 },
              thickness: 1,
              color: rgb(0.7, 0.7, 0.7),
            });
          }

          // Clean the item text
          const cleanItem = item.startsWith("• ") ? item.substring(2) : item;
          const lines = wrapText(cleanItem, maxCharsPerLine - 10);

          // Add bullet point for first line
          page.drawText("•", {
            x: margin + 15,
            y: yPosition,
            size: 12,
            font: helveticaBold,
            color: rgb(0.2, 0.4, 0.8),
          });

          // Display wrapped text with proper indentation
          lines.forEach((line, lineIndex) => {
            if (yPosition < margin + 60) {
              const newPage = pdfDoc.addPage();
              page = newPage;
              yPosition = auditHeight - 100;

              if (logoImage) {
                page.drawImage(logoImage, {
                  x: auditWidth - logoSize - 30,
                  y: auditHeight - logoSize - 30,
                  width: logoSize,
                  height: logoSize,
                });
              }
            }

            page.drawText(line, {
              x: lineIndex === 0 ? margin + 35 : margin + 25,
              y: yPosition,
              size: 11,
              font: helveticaFont,
              color: rgb(0.1, 0.1, 0.1),
            });
            yPosition -= 18; // Increased line spacing
          });

          yPosition -= 15; // Extra space between bullet points
        });
      } else if (typeof content === "string" && content) {
        // Better formatting for single text content
        const lines = wrapText(content, maxCharsPerLine - 6);
        lines.forEach((line, lineIndex) => {
          if (yPosition < margin + 80) {
            const newPage = pdfDoc.addPage();
            page = newPage;
            yPosition = auditHeight - 100;

            // Add logo and section continuation header to new page
            if (logoImage) {
              page.drawImage(logoImage, {
                x: auditWidth - logoSize - 30,
                y: auditHeight - logoSize - 30,
                width: logoSize,
                height: logoSize,
              });
            }

            page.drawText(`${title} (continued)`, {
              x: margin,
              y: auditHeight - 60,
              size: 16,
              font: helveticaBold,
              color: rgb(0.1, 0.1, 0.1),
            });

            page.drawLine({
              start: { x: margin, y: auditHeight - 80 },
              end: { x: auditWidth - margin, y: auditHeight - 80 },
              thickness: 1,
              color: rgb(0.7, 0.7, 0.7),
            });
          }

          page.drawText(line, {
            x: margin + 20,
            y: yPosition,
            size: 11,
            font: helveticaFont,
            color: rgb(0.1, 0.1, 0.1),
          });
          yPosition -= 18; // Increased line spacing
        });
      } else if (Array.isArray(content) && isDetailed) {
        // Handle detailed analysis with better paragraph formatting
        content.forEach((paragraph, index) => {
          if (yPosition < margin + 120) {
            const newPage = pdfDoc.addPage();
            page = newPage;
            yPosition = auditHeight - 100;

            // Add logo and section continuation header to new page
            if (logoImage) {
              page.drawImage(logoImage, {
                x: auditWidth - logoSize - 30,
                y: auditHeight - logoSize - 30,
                width: logoSize,
                height: logoSize,
              });
            }

            page.drawText(`${title} (continued)`, {
              x: margin,
              y: auditHeight - 60,
              size: 16,
              font: helveticaBold,
              color: rgb(0.1, 0.1, 0.1),
            });

            page.drawLine({
              start: { x: margin, y: auditHeight - 80 },
              end: { x: auditWidth - margin, y: auditHeight - 80 },
              thickness: 1,
              color: rgb(0.7, 0.7, 0.7),
            });
          }

          // Add numbered paragraph with better spacing
          page.drawText(`${index + 1}.`, {
            x: margin + 10,
            y: yPosition,
            size: 12,
            font: helveticaBold,
            color: rgb(0.2, 0.4, 0.8),
          });

          // Format paragraph with proper line spacing and indentation
          const paragraphLines = wrapText(paragraph, maxCharsPerLine - 10);
          let isFirstLine = true;

          paragraphLines.forEach((line, lineIndex) => {
            if (yPosition < margin + 60) {
              const newPage = pdfDoc.addPage();
              page = newPage;
              yPosition = auditHeight - 100;

              if (logoImage) {
                page.drawImage(logoImage, {
                  x: auditWidth - logoSize - 30,
                  y: auditHeight - logoSize - 30,
                  width: logoSize,
                  height: logoSize,
                });
              }
            }

            page.drawText(line, {
              x: isFirstLine ? margin + 35 : margin + 20,
              y: yPosition,
              size: 11,
              font: helveticaFont,
              color: rgb(0.1, 0.1, 0.1),
            });

            yPosition -= 18; // Increased line spacing
            isFirstLine = false;
          });

          yPosition -= 20; // Extra space between numbered paragraphs
        });
      }
      yPosition -= 30; // Extra space after section

      return page;
    };

    // Display structured sections with proper page management
    let currentPage = auditPage;

    if (auditSections.summary) {
      currentPage = addSection(
        currentPage,
        "EXECUTIVE SUMMARY",
        auditSections.summary,
      );
    }

    if (auditSections.security_score) {
      currentPage = addSection(
        currentPage,
        "SECURITY ASSESSMENT",
        auditSections.security_score,
      );
    }

    if (auditSections.vulnerabilities.length > 0) {
      currentPage = addSection(
        currentPage,
        "IDENTIFIED VULNERABILITIES",
        auditSections.vulnerabilities,
        true,
      );
    }

    if (auditSections.recommendations.length > 0) {
      currentPage = addSection(
        currentPage,
        "RECOMMENDATIONS",
        auditSections.recommendations,
        true,
      );
    }

    if (auditSections.details.length > 0) {
      currentPage = addSection(
        currentPage,
        "DETAILED ANALYSIS",
        auditSections.details,
        false,
        true // Special flag for detailed analysis
      );
    }

    // Add code summary page with improved formatting
    const codePage = pdfDoc.addPage();

    // Add logo to code page header
    if (logoImage) {
      codePage.drawImage(logoImage, {
        x: width - logoSize - 30,
        y: height - logoSize - 30,
        width: logoSize,
        height: logoSize,
      });
    } else {
      // Fallback text logo
      codePage.drawRectangle({
        x: width - logoSize - 30,
        y: height - logoSize - 30,
        width: logoSize,
        height: logoSize,
        borderWidth: 1,
        borderColor: rgb(0.2, 0.4, 0.8),
      });

      codePage.drawText("AUDIT", {
        x: width - logoSize - 15,
        y: height - 50,
        size: 12,
        font: helveticaBold,
        color: rgb(0.2, 0.4, 0.8),
      });

      codePage.drawText("WARP", {
        x: width - logoSize - 12,
        y: height - 65,
        size: 12,
        font: helveticaBold,
        color: rgb(0.2, 0.4, 0.8),
      });
    }

    codePage.drawText("CONTRACT CODE SUMMARY", {
      x: 50,
      y: height - 60,
      size: 18,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Add horizontal line
    codePage.drawLine({
      start: { x: 50, y: height - 80 },
      end: { x: width - 50, y: height - 80 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Add code background area
    codePage.drawRectangle({
      x: 40,
      y: 100,
      width: width - 80,
      height: height - 200,
      color: rgb(0.97, 0.97, 0.97),
      borderWidth: 1,
      borderColor: rgb(0.8, 0.8, 0.8),
    });

    codePage.drawText("Contract Source Code:", {
      x: 50,
      y: height - 110,
      size: 12,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Format code preserving IDE-like structure
    const formattedCodeLines = formatContractCode(contractCode);
    let codeY = height - 140;
    let lineNumber = 1;
    const maxLines = Math.floor((codeY - 120) / 12); // Calculate max lines that fit

    // Display line numbers and code
    formattedCodeLines.slice(0, maxLines).forEach((line, index) => {
      if (codeY < 120) return; // Stop if we run out of space

      // Draw line number background
      codePage.drawRectangle({
        x: 45,
        y: codeY - 2,
        width: 25,
        height: 12,
        color: rgb(0.9, 0.9, 0.9),
      });

      // Draw line number
      codePage.drawText(lineNumber.toString().padStart(3, ' '), {
        x: 47,
        y: codeY,
        size: 8,
        font: courier,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Draw vertical separator
      codePage.drawLine({
        start: { x: 72, y: codeY - 2 },
        end: { x: 72, y: codeY + 10 },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });

      // Draw code line with proper indentation preserved
      const displayLine = line.length > 85 ? line.substring(0, 85) + "..." : line;

      codePage.drawText(displayLine, {
        x: 77,
        y: codeY,
        size: 8,
        font: courier,
        color: rgb(0.1, 0.1, 0.1),
      });

      codeY -= 12;
      lineNumber++;
    });

    // Add code statistics
    const totalLines = formattedCodeLines.length;
    const displayedLines = Math.min(maxLines, totalLines);

    codePage.drawText(`Displaying ${displayedLines} of ${totalLines} lines`, {
      x: 50,
      y: 90,
      size: 9,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    if (totalLines > maxLines) {
      codePage.drawText("[Code truncated for PDF - full code analyzed in audit]", {
        x: 50,
        y: 75,
        size: 9,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    // Add professional footer with certification on each page
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      const page = pdfDoc.getPage(i);

      // Footer line
      page.drawLine({
        start: { x: 50, y: 50 },
        end: { x: width - 50, y: 50 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });

      page.drawText("Certified by AuditWarp", {
        x: 50,
        y: 30,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });

      page.drawText(`Page ${i + 1} of ${pdfDoc.getPageCount()}`, {
        x: width - 100,
        y: 30,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    // Serialize the PDF document
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error("Failed to generate PDF report");
  }
}

/**
 * Generate an audit report with options to store on IPFS and Walrus.
 * @param auditData - The audit data to generate the report from.
 * @param useWalrus - Whether to upload the report to Walrus.
 */
export async function generateAuditReport(
  auditData: AuditReportData,
  useWalrus: boolean = true
): Promise<{ pdfBytes: Uint8Array } & StorageResult> {
  // Generate the PDF report
  const pdfBlob = await generatePDF(auditData.contractName || "Smart Contract", auditData.contractCode, JSON.stringify(auditData));
  const pdfBytes = await pdfBlob.arrayBuffer();
  const pdfBytesUint8Array = new Uint8Array(pdfBytes);

  const result: { pdfBytes: Uint8Array } & StorageResult = { pdfBytes: pdfBytesUint8Array };

  // Upload to IPFS
  try {
    const ipfsResult = await pinFileToIPFS(pdfBytesUint8Array, `audit-report-${auditData.auditId}.pdf`);
    result.ipfsHash = ipfsResult.IpfsHash;
    result.ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsResult.IpfsHash}`;
  } catch (error) {
    console.error("IPFS upload failed:", error);
    toast.error("IPFS upload failed, continuing with Walrus only");
  }

  // Upload to Walrus if enabled
  if (useWalrus) {
    try {
      const walrusMetadata = await uploadPDFToWalrus(pdfBytesUint8Array);
      result.walrusMetadata = walrusMetadata;
      result.walrusUrl = `https://aggregator.walrus-testnet.walrus.space/v1/${walrusMetadata.blobId}`;
      toast.success("Report successfully stored on Walrus decentralized storage!");
    } catch (error) {
      console.error("Walrus upload failed:", error);
      toast.error("Walrus upload failed, using IPFS fallback");
    }
  }

  return result;
}