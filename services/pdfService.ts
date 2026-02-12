import {
  documentDirectory,
  writeAsStringAsync,
  EncodingType,
} from "expo-file-system";
import { Platform } from "react-native";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Bill } from "./api";

interface PDFResult {
  uri: string;
  fileName: string;
}

class PDFService {
  // Generate HTML content for the bill
  generateBillHTML(bill: Bill): string {
    const workDoneItems =
      "workDone" in bill && bill.workDone && bill.workDone.length > 0
        ? bill.workDone
            .map(
              (work: any, index: number) => `
          <tr>
            <td>${index + 1}</td>
            <td>${work.workName}</td>
            <td>${work.price.toFixed(2)}</td>
          </tr>
        `
            )
            .join("")
        : "";

    const itemsList =
      bill.items && bill.items.length > 0
        ? bill.items
            .map(
              (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.itemName}</td>
            <td>${item.quantity} ${item.unit || ""}</td>
            <td>${item.rate.toFixed(2)}</td>
            <td>${item.amount.toFixed(2)}</td>
          </tr>
        `
            )
            .join("")
        : "";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bill - ${bill.customerName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            background-color: #3498db;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .section {
            background-color: white;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 15px;
            border-bottom: 2px solid #3498db;
            padding-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f8f9fa;
            font-weight: bold;
          }
          .amount-summary {
            background-color: #2c3e50;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .total-amount {
            font-size: 20px;
            font-weight: bold;
            color: #27ae60;
          }
          .advance-amount {
            font-size: 16px;
            color: #3498db;
          }
          .balance-amount {
            font-size: 24px;
            font-weight: bold;
            color: #e74c3c;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            background-color: #ecf0f1;
            border-radius: 8px;
            font-style: italic;
            color: #7f8c8d;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚗 AKR WORKSHOP BILL</h1>
          <h2>${bill.customerName}</h2>
          <p>Vehicle: ${bill.vehicleNumber}</p>
          ${
            bill.vehicleName && bill.vehicleName.trim()
              ? `<p>Model: ${bill.vehicleName}</p>`
              : ""
          }
          <p>Date: ${new Date(bill.createdAt).toLocaleDateString("en-IN")}</p>
        </div>

        ${
          bill.workDescription
            ? `
        <div class="section">
          <div class="section-title">WORK DESCRIPTION</div>
          <p>${bill.workDescription}</p>
        </div>
        `
            : ""
        }

        ${
          workDoneItems
            ? `
        <div class="section">
          <div class="section-title">WORK DONE</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Work Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${workDoneItems}
            </tbody>
          </table>
        </div>
        `
            : ""
        }

        ${
          itemsList
            ? `
        <div class="section">
          <div class="section-title">SPARE PARTS & ITEMS</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>
        </div>
        `
            : ""
        }

        <div class="amount-summary">
          <div class="amount-row">
            <span>Total Amount:</span>
            <span class="total-amount">${bill.totalAmount.toFixed(2)}</span>
          </div>
          ${
            bill.advanceAmount > 0
              ? `
          <div class="amount-row">
            <span>Advance Paid:</span>
            <span class="advance-amount">${bill.advanceAmount.toFixed(2)}</span>
          </div>
          `
              : ""
          }
          <div class="amount-row" style="border-top: 2px solid rgba(255,255,255,0.3); padding-top: 15px;">
            <span>Balance Due:</span>
            <span class="balance-amount">${bill.balanceAmount.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for choosing AKR Workshop!</p>
          <p>For any queries, please contact us.</p>
        </div>
      </body>
      </html>
    `;
  }

  // Save HTML content to file system
  async saveHTMLToFile(htmlContent: string, fileName: string): Promise<string> {
    const fileUri = `${documentDirectory}${fileName}`;
    await writeAsStringAsync(fileUri, htmlContent, {
      encoding: EncodingType.UTF8 as any,
    });
    return fileUri;
  }

  // Helper function to handle logo loading for PDF
  async loadImageForPDF(
    doc: any,
    logoUrl: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (logoUrl.startsWith("data:")) {
          // Handle Base64 encoded images
          console.log(
            "Processing Base64 logo:",
            logoUrl.substring(0, 50) + "..."
          );
          const matches = logoUrl.match(
            /^data:image\/([a-zA-Z]+);base64,(.+)$/
          );
          if (matches && matches[1] && matches[2]) {
            const format = matches[1].toUpperCase();
            console.log("Adding Base64 image with format:", format);
            doc.addImage(logoUrl, format, x, y, width, height);
            resolve();
          } else {
            console.error("Invalid Base64 image format. Matches:", matches);
            reject(new Error("Invalid Base64 image format"));
          }
        } else if (logoUrl.startsWith("http")) {
          // For remote URLs, we'll try to add them directly
          // Note: This may not work in all environments
          const format = logoUrl.endsWith(".png")
            ? "PNG"
            : logoUrl.endsWith(".jpg") || logoUrl.endsWith(".jpeg")
            ? "JPEG"
            : logoUrl.endsWith(".gif")
            ? "GIF"
            : "PNG";
          doc.addImage(logoUrl, format, x, y, width, height);
          resolve();
        } else {
          // For other cases, log and resolve
          console.log("Skipping logo that cannot be loaded in PDF:", logoUrl);
          resolve();
        }
      } catch (error) {
        console.warn("Could not load logo image for PDF:", error);
        resolve(); // Resolve anyway to continue with PDF generation
      }
    });
  }

  // Generate actual PDF file using jsPDF
  async generatePDF(bill: Bill): Promise<PDFResult> {
    try {
      console.log("Starting PDF generation for bill:", bill.id || "new");

      // Create new PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // AutoTable is imported as a function and used as autoTable(doc, options)
      // This is the correct approach for Expo/Hermes environments
      console.log("jsPDF instance created, AutoTable function available");

      // Set font and colors
      doc.setFont("helvetica");

      // Business Information with logo support - prioritize environment logo, fallback to local asset
      let logoUrl = process.env.EXPO_PUBLIC_LOGO_URL || null;

      // If no environment logo is set, try to use the local logo asset
      if (!logoUrl) {
        // For local assets, we need to handle them differently
        // We'll create a simple placeholder since jsPDF can't directly load local files
        // The actual local logo will be embedded via Base64
        try {
          // For now, we'll skip local asset embedding in PDF and rely on environment variable
          console.log("Using environment logo or skipping local asset for PDF");
        } catch (error) {
          console.warn("Could not prepare local logo asset:", error);
        }
      }

      const businessInfo = {
        name: process.env.EXPO_PUBLIC_BUSINESS_NAME || "AKR WORKSHOP",
        address:
          process.env.EXPO_PUBLIC_BUSINESS_ADDRESS ||
          "123 Main Street, City, State",
        phone: process.env.EXPO_PUBLIC_BUSINESS_PHONE || "+91 9876543210",
        logoUrl: logoUrl,
      };

      console.log("Business Info:", businessInfo);
      console.log("Logo URL:", businessInfo.logoUrl);
      console.log(
        "Logo URL length:",
        businessInfo.logoUrl ? businessInfo.logoUrl.length : 0
      );

      // Clean Business Header with proper alignment
      let yPos = 15;

      // Add Logo if available
      if (businessInfo.logoUrl) {
        await this.loadImageForPDF(doc, businessInfo.logoUrl, 20, yPos, 30, 20);
        // Adjust yPos to account for logo height
        yPos += 25;
      }

      // Business Name (Center aligned)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0); // Black color for clean printing
      doc.text(businessInfo.name, 105, yPos, { align: "center" });
      yPos += 7;

      // Business Address (Center aligned)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const addressLines = doc.splitTextToSize(businessInfo.address, 180);
      doc.text(addressLines, 105, yPos, { align: "center" });
      yPos += addressLines.length * 5 + 2;

      // Phone Number (Center aligned)
      doc.setFontSize(10);
      doc.text(`Phone: ${businessInfo.phone}`, 105, yPos, { align: "center" });
      yPos += 8;

      // Horizontal line separator
      doc.setDrawColor(0, 0, 0);
      doc.line(15, yPos, 195, yPos);
      yPos += 10;

      // Customer Information with proper alignment
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text(`Customer: ${bill.customerName}`, 15, yPos);

      // Right align date
      const dateText = `Date: ${new Date(bill.createdAt).toLocaleDateString(
        "en-IN"
      )}`;
      const dateWidth = doc.getTextWidth(dateText);
      doc.text(dateText, 195 - dateWidth, yPos);
      yPos += 7;

      doc.text(`Vehicle: ${bill.vehicleNumber}`, 15, yPos);
      yPos += 7;

      // Add vehicle name if available
      if (bill.vehicleName && bill.vehicleName.trim()) {
        doc.text(`Model: ${bill.vehicleName}`, 15, yPos);
        yPos += 5;
      }
      yPos += 5;

      // Reset to standard font settings
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);

      // Work Description section
      if (bill.workDescription) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("WORK DESCRIPTION", 15, yPos);
        yPos += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        const splitDesc = doc.splitTextToSize(bill.workDescription, 180);
        doc.text(splitDesc, 15, yPos);
        yPos += splitDesc.length * 6 + 5;
      }

      // Work Done section
      if ("workDone" in bill && bill.workDone && bill.workDone.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("WORK DONE", 15, yPos);
        yPos += 10;

        // Create work done table with clean formatting
        const workDoneData = bill.workDone.map((work: any, index: number) => [
          (index + 1).toString(),
          work.workName,
          work.price.toFixed(2), // Clean number without currency symbol in table
        ]);

        // Use AutoTable with clean styling
        autoTable(doc, {
          startY: yPos,
          head: [["#", "Work Description", "Amount (₹)"]],
          body: workDoneData,
          theme: "striped",
          styles: {
            fontSize: 10,
            font: "helvetica",
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: "bold",
          },
          bodyStyles: {
            textColor: [0, 0, 0],
          },
          margin: { left: 15, right: 15 },
          columnStyles: {
            0: { cellWidth: 15 }, // # column
            1: { cellWidth: 120 }, // Description column
            2: { cellWidth: 30, halign: "right" }, // Amount column
          },
        });

        yPos = (doc as any).lastAutoTable.finalY + 12;
      }

      // Items section
      if (bill.items && bill.items.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("SPARE PARTS & ITEMS", 15, yPos);
        yPos += 10;

        // Create items table with clean formatting
        const itemsData = bill.items.map((item, index) => [
          (index + 1).toString(),
          item.itemName,
          `${item.quantity} ${item.unit || ""}`,
          item.rate.toFixed(2), // Clean numbers
          item.amount.toFixed(2), // Clean numbers
        ]);

        // Use AutoTable with proper column alignment
        autoTable(doc, {
          startY: yPos,
          head: [["#", "Item Name", "Quantity", "Rate (₹)", "Amount (₹)"]],
          body: itemsData,
          theme: "striped",
          styles: {
            fontSize: 10,
            font: "helvetica",
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: "bold",
          },
          bodyStyles: {
            textColor: [0, 0, 0],
          },
          margin: { left: 15, right: 15 },
          columnStyles: {
            0: { cellWidth: 10 }, // # column
            1: { cellWidth: 80 }, // Item name
            2: { cellWidth: 25, halign: "center" }, // Quantity
            3: { cellWidth: 25, halign: "right" }, // Rate
            4: { cellWidth: 25, halign: "right" }, // Amount
          },
        });

        yPos = (doc as any).lastAutoTable.finalY + 12;
      }

      // Clean Amount Summary with proper alignment
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);

      // Total Amount (Right aligned)
      const totalText = `Total Amount: ${bill.totalAmount.toFixed(2)}`;
      const totalWidth = doc.getTextWidth(totalText);
      doc.text(totalText, 195 - totalWidth, yPos);
      yPos += 8;

      if (bill.advanceAmount > 0) {
        const advanceText = `Advance Paid: ${bill.advanceAmount.toFixed(2)}`;
        const advanceWidth = doc.getTextWidth(advanceText);
        doc.text(advanceText, 195 - advanceWidth, yPos);
        yPos += 8;
      }

      // Balance Due with emphasis
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      const balanceText = `Balance Due: ${bill.balanceAmount.toFixed(2)}`;
      const balanceWidth = doc.getTextWidth(balanceText);
      doc.text(balanceText, 195 - balanceWidth, yPos);

      // Add underline for emphasis
      doc.line(195 - balanceWidth, yPos + 2, 195, yPos + 2);
      yPos += 12;

      // Clean Footer
      yPos += 15;
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text("Thank you for choosing AKR Workshop!", 105, yPos, {
        align: "center",
      });
      yPos += 6;
      doc.text("For any queries, please contact us.", 105, yPos, {
        align: "center",
      });

      // Generate PDF as ArrayBuffer for compatibility
      const pdfArrayBuffer = doc.output("arraybuffer");

      // For web, save the PDF directly
      if (typeof window !== "undefined" && window.location) {
        try {
          // Save the PDF directly in the browser
          doc.save(
            `bill_${bill.customerName.replace(
              /[^a-zA-Z0-9]/g,
              "_"
            )}_${Date.now()}.pdf`
          );
          console.log("PDF saved successfully for web platform");
          // Return a placeholder URL since the file is already saved
          return {
            uri: `file://${documentDirectory}bill_${bill.customerName.replace(
              /[^a-zA-Z0-9]/g,
              "_"
            )}_${Date.now()}.pdf`,
            fileName: `bill_${bill.customerName.replace(
              /[^a-zA-Z0-9]/g,
              "_"
            )}_${Date.now()}.pdf`,
          };
        } catch (webError) {
          console.error("Error saving PDF for web:", webError);
          throw new Error(
            `Web PDF generation failed: ${
              webError instanceof Error ? webError.message : "Unknown error"
            }`
          );
        }
      }

      try {
        const base64Data = EncodingType.Base64;
        const uint8Array = new Uint8Array(pdfArrayBuffer);
        let binary = "";
        uint8Array.forEach((byte) => {
          binary += String.fromCharCode(byte);
        });
        const base64String = btoa(binary);

        const fileName = `bill_${bill.id || "unknown"}_${Date.now()}.pdf`;
        const fileUri = `${documentDirectory}${fileName}`;

        await writeAsStringAsync(fileUri, base64String, {
          encoding: EncodingType.Base64,
        });

        console.log("PDF generated successfully for mobile platform:", fileUri);
        return {
          uri: fileUri,
          fileName: `bill_${bill.customerName.replace(
            /[^a-zA-Z0-9]/g,
            "_"
          )}_${Date.now()}.pdf`,
        };
      } catch (mobileError) {
        console.error("Error saving PDF on mobile:", mobileError);
        throw new Error(
          `Mobile PDF generation failed: ${
            mobileError instanceof Error ? mobileError.message : "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      if (error instanceof Error) {
        throw new Error(`PDF generation failed: ${error.message}`);
      } else {
        throw new Error("PDF generation failed: Unknown error");
      }
    }
  }

  // Method to share PDF using expo-sharing
  async sharePDF(bill: Bill): Promise<boolean> {
    try {
      const pdfResult = await this.generatePDF(bill);

      // Only proceed with sharing if not on web
      if (typeof window !== "undefined" && window.location) {
        console.log(
          "Web environment - skipping native share, PDF already downloaded"
        );
        return true;
      }

      // On mobile, use expo-sharing
      const { default: Sharing } = await import("expo-sharing");

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfResult.uri, {
          mimeType: "application/pdf",
          dialogTitle: `Share bill for ${bill.customerName}`,
        });
        return true;
      } else {
        console.log("Sharing is not available on this device");
        return false;
      }
    } catch (error) {
      console.error("Error sharing PDF:", error);
      throw error;
    }
  }
}

export const pdfService = new PDFService();
