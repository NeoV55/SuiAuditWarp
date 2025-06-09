import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import logo from "../../../attached_assets/logo-removebg-preview.png";

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
    details: "",
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

  // If we didn't find structured content, create a better summary
  if (
    !sections.summary &&
    sections.vulnerabilities.length === 0 &&
    sections.recommendations.length === 0
  ) {
    const firstSentences = sentences.slice(0, 2).join(". ");
    sections.summary = firstSentences + ".";
    sections.details = sentences.slice(2).join(". ") + ".";
  } else {
    sections.details = currentDetails.join(". ") + ".";
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

  return sections;
}

/**
 * Generate a PDF report from audit data
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

    // Add logo to audit page header
    if (logoImage) {
      auditPage.drawImage(logoImage, {
        x: width - logoSize - 30,
        y: height - logoSize - 30,
        width: logoSize,
        height: logoSize,
      });
    } else {
      // Fallback text logo
      auditPage.drawRectangle({
        x: width - logoSize - 30,
        y: height - logoSize - 30,
        width: logoSize,
        height: logoSize,
        borderWidth: 1,
        borderColor: rgb(0.2, 0.4, 0.8),
      });

      auditPage.drawText("AUDIT", {
        x: width - logoSize - 15,
        y: height - 50,
        size: 12,
        font: helveticaBold,
        color: rgb(0.2, 0.4, 0.8),
      });

      auditPage.drawText("WARP", {
        x: width - logoSize - 12,
        y: height - 65,
        size: 12,
        font: helveticaBold,
        color: rgb(0.2, 0.4, 0.8),
      });
    }

    auditPage.drawText("AUDIT FINDINGS", {
      x: 50,
      y: height - 60,
      size: 18,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Add horizontal line
    auditPage.drawLine({
      start: { x: 50, y: height - 80 },
      end: { x: width - 50, y: height - 80 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Parse and display structured audit results
    const margin = 50;
    const maxCharsPerLine = 75;
    let yPosition = height - 110;

    const auditSections = parseAuditResults(auditResult);

    // Helper function to add section content with better formatting
    const addSection = (
      page: any,
      title: string,
      content: string | string[],
      isArray = false,
    ) => {
      // Check if we need a new page
      if (yPosition < margin + 100) {
        const newPage = pdfDoc.addPage();
        page = newPage;
        yPosition = height - 80;

        // Add logo to new page
        if (logoImage) {
          page.drawImage(logoImage, {
            x: width - logoSize - 30,
            y: height - logoSize - 30,
            width: logoSize,
            height: logoSize,
          });
        } else {
          // Fallback text logo
          page.drawRectangle({
            x: width - logoSize - 30,
            y: height - logoSize - 30,
            width: logoSize,
            height: logoSize,
            borderWidth: 1,
            borderColor: rgb(0.2, 0.4, 0.8),
          });
          page.drawText("AUDIT", {
            x: width - logoSize - 15,
            y: height - 50,
            size: 12,
            font: helveticaBold,
            color: rgb(0.2, 0.4, 0.8),
          });
          page.drawText("WARP", {
            x: width - logoSize - 12,
            y: height - 65,
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
        width: width - margin * 2 + 10,
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
          // Add bullet point for list items
          const cleanItem = item.startsWith("• ") ? item.substring(2) : item;
          const lines = wrapText(cleanItem, maxCharsPerLine - 8);

          lines.forEach((line, lineIndex) => {
            if (yPosition < margin + 50) {
              const newPage = pdfDoc.addPage();
              page = newPage;
              yPosition = height - 80;
            }

            if (lineIndex === 0) {
              // Add bullet point
              page.drawText("•", {
                x: margin + 10,
                y: yPosition,
                size: 12,
                font: helveticaBold,
                color: rgb(0.2, 0.4, 0.8),
              });
            }

            page.drawText(line, {
              x: margin + 25,
              y: yPosition,
              size: 11,
              font: helveticaFont,
              color: rgb(0.1, 0.1, 0.1),
            });
            yPosition -= 16;
          });
          yPosition -= 8; // Extra space between items
        });
      } else if (typeof content === "string" && content) {
        const lines = wrapText(content, maxCharsPerLine - 4);
        lines.forEach((line) => {
          if (yPosition < margin + 50) {
            const newPage = pdfDoc.addPage();
            page = newPage;
            yPosition = height - 80;
          }

          page.drawText(line, {
            x: margin + 15,
            y: yPosition,
            size: 11,
            font: helveticaFont,
            color: rgb(0.1, 0.1, 0.1),
          });
          yPosition -= 16;
        });
      }
      yPosition -= 20; // Extra space after section

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

    if (auditSections.details) {
      currentPage = addSection(
        currentPage,
        "DETAILED ANALYSIS",
        auditSections.details,
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

    // Display contract code with proper formatting and truncation
    const maxCodeLines = 35; // Limit code lines to fit on page
    const codeLines = contractCode
      .split("\n")
      .slice(0, maxCodeLines)
      .map((line) => line.substring(0, 85)); // Truncate long lines

    let codeYPosition = height - 110;
    codeLines.forEach((line, index) => {
      if (codeYPosition < margin + 50) {
        // Code continues on next page indicator
        codePage.drawText("... [Code continues in full version]", {
          x: margin,
          y: codeYPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
        });
        return;
      }

      codePage.drawText(`${(index + 1).toString().padStart(3, " ")} ${line}`, {
        x: margin,
        y: codeYPosition,
        size: 8,
        font: courier,
        color: rgb(0.1, 0.1, 0.1),
      });
      codeYPosition -= 12;
    });

    if (contractCode.split("\n").length > maxCodeLines) {
      codePage.drawText(
        `... and ${contractCode.split("\n").length - maxCodeLines} more lines`,
        {
          x: margin,
          y: codeYPosition - 10,
          size: 9,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
        },
      );
    }

    // Add footer to all pages
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      const page = pdfDoc.getPage(i);
      page.drawText(`AuditWarp Report - Page ${i + 1}`, {
        x: margin,
        y: 30,
        size: 8,
        font: helveticaFont,
        color: rgb(0.6, 0.6, 0.6),
      });

      page.drawText("Confidential", {
        x: width - 100,
        y: 30,
        size: 8,
        font: helveticaFont,
        color: rgb(0.6, 0.6, 0.6),
      });
    }

    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();

    // Return as blob
    return new Blob([pdfBytes], { type: "application/pdf" });
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}