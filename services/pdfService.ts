import {
  documentDirectory,
  writeAsStringAsync,
  EncodingType,
  readAsStringAsync,
} from "expo-file-system";
import { Platform, Linking } from "react-native";
import * as Sharing from "expo-sharing";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Bill } from "./api";
import { Asset } from "expo-asset";

interface PDFResult {
  uri: string;
  fileName: string;
}

class PDFService {
  private logoBase64: string | null = null;

  // Load logo and convert to base64
  async loadLogo(): Promise<string | null> {
    try {
      // If already loaded, return cached version
      if (this.logoBase64) {
        return this.logoBase64;
      }

      // For web platform, use fetch to load the image
      if (Platform.OS === "web") {
        try {
          const response = await fetch(require("../assets/logo.png"));
          const blob = await response.blob();
          
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = reader.result as string;
              this.logoBase64 = base64data;
              resolve(base64data);
            };
            reader.onerror = () => {
              console.warn("Could not read logo file on web");
              resolve(null);
            };
            reader.readAsDataURL(blob);
          });
        } catch (webError) {
          console.warn("Could not load logo on web:", webError);
          return null;
        }
      }

      // For mobile platforms, use expo-asset
      try {
        const asset = Asset.fromModule(require("../assets/logo.png"));
        await asset.downloadAsync();
        
        if (asset.localUri) {
          const base64 = await readAsStringAsync(asset.localUri, {
            encoding: EncodingType.Base64,
          });
          this.logoBase64 = `data:image/png;base64,${base64}`;
          return this.logoBase64;
        }
      } catch (mobileError) {
        console.warn("Could not load logo on mobile:", mobileError);
        return null;
      }

      return null;
    } catch (error) {
      console.warn("Error loading logo:", error);
      return null;
    }
  }

  // Generate HTML content for the bill
  async generateBillHTML(bill: Bill): Promise<string> {
    // Load logo as base64
    const logoBase64 = await this.loadLogo();
    
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
          .logo {
            text-align: center;
            margin-bottom: 20px;
          }
          .logo img {
            width: 80px;
            height: 80px;
            object-fit: contain;
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
        ${logoBase64 ? `<div class="logo"><img src="${logoBase64}" alt="Logo" /></div>` : ''}
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

      console.log("jsPDF instance created");

      // Set font and colors
      doc.setFont("helvetica");

      // Load logo
      const logoBase64 = await this.loadLogo();

      // Business Information
      const businessInfo = {
        name: process.env.EXPO_PUBLIC_BUSINESS_NAME || "AKR WORKSHOP",
        address:
          process.env.EXPO_PUBLIC_BUSINESS_ADDRESS ||
          "123 Main Street, City, State",
        phone: process.env.EXPO_PUBLIC_BUSINESS_PHONE || "+91 9876543210",
      };

      // Clean Business Header with proper alignment
      let yPos = 15;

      // Add Logo at the top center if available
      if (logoBase64) {
        try {
          const logoWidth = 30;
          const logoHeight = 30;
          const logoX = (210 - logoWidth) / 2; // Center horizontally (A4 width is 210mm)
          
          doc.addImage(logoBase64, "PNG", logoX, yPos, logoWidth, logoHeight);
          yPos += logoHeight + 5; // Add space after logo
          console.log("Logo added to PDF successfully");
        } catch (logoError) {
          console.warn("Could not add logo to PDF:", logoError);
          // Continue without logo
        }
      } else {
        console.log("No logo available, continuing without logo");
      }

      // Business Name (Center aligned)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
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

      // Customer Information
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

        const workDoneData = bill.workDone.map((work: any, index: number) => [
          (index + 1).toString(),
          work.workName,
          work.price.toFixed(2),
        ]);

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
            0: { cellWidth: 15 },
            1: { cellWidth: 120 },
            2: { cellWidth: 30, halign: "right" },
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

        const itemsData = bill.items.map((item, index) => [
          (index + 1).toString(),
          item.itemName,
          `${item.quantity} ${item.unit || ""}`,
          item.rate.toFixed(2),
          item.amount.toFixed(2),
        ]);

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
            0: { cellWidth: 10 },
            1: { cellWidth: 80 },
            2: { cellWidth: 25, halign: "center" },
            3: { cellWidth: 25, halign: "right" },
            4: { cellWidth: 25, halign: "right" },
          },
        });

        yPos = (doc as any).lastAutoTable.finalY + 12;
      }

      // Amount Summary
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);

      const totalText = `Total Amount: ₹${bill.totalAmount.toFixed(2)}`;
      const totalWidth = doc.getTextWidth(totalText);
      doc.text(totalText, 195 - totalWidth, yPos);
      yPos += 8;

      if (bill.advanceAmount > 0) {
        const advanceText = `Advance Paid: ₹${bill.advanceAmount.toFixed(2)}`;
        const advanceWidth = doc.getTextWidth(advanceText);
        doc.text(advanceText, 195 - advanceWidth, yPos);
        yPos += 8;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      const balanceText = `Balance Due: ₹${bill.balanceAmount.toFixed(2)}`;
      const balanceWidth = doc.getTextWidth(balanceText);
      doc.text(balanceText, 195 - balanceWidth, yPos);
      doc.line(195 - balanceWidth, yPos + 2, 195, yPos + 2);
      yPos += 12;

      // Footer
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

      // Generate PDF as base64 string
      const pdfBase64 = doc.output("datauristring");
      const base64Data = pdfBase64.split(",")[1];
      
      const fileName = `bill_${bill.customerName.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}_${Date.now()}.pdf`;

      // For web platform - trigger download
      if (Platform.OS === "web") {
        try {
          if (typeof document !== "undefined") {
            const linkSource = pdfBase64;
            const downloadLink = document.createElement("a");
            downloadLink.href = linkSource;
            downloadLink.download = fileName;
            downloadLink.click();
            console.log("PDF downloaded successfully for web");
          }
          
          return {
            uri: pdfBase64,
            fileName: fileName,
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

      // For mobile platforms - save to file system
      try {
        const fileUri = `${documentDirectory}${fileName}`;
        await writeAsStringAsync(fileUri, base64Data, {
          encoding: EncodingType.Base64,
        });

        console.log("PDF saved to:", fileUri);
        return {
          uri: fileUri,
          fileName: fileName,
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

  // Share PDF via native share sheet (works on mobile)
  async sharePDF(bill: Bill): Promise<boolean> {
    try {
      const pdfResult = await this.generatePDF(bill);

      // On web, PDF is already downloaded
      if (Platform.OS === "web") {
        console.log("Web: PDF downloaded automatically");
        return true;
      }

      // On mobile, check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(pdfResult.uri, {
          mimeType: "application/pdf",
          dialogTitle: `Share bill for ${bill.customerName}`,
        });
        return true;
      } else {
        console.log("Sharing not available on this device");
        // Try to open the file directly
        if (pdfResult.uri) {
          await Linking.openURL(pdfResult.uri);
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error("Error sharing PDF:", error);
      throw error;
    }
  }

  // Share via WhatsApp with text message (no PDF)
  async shareViaWhatsAppText(bill: Bill): Promise<boolean> {
    try {
      const message = this.generateWhatsAppMessage(bill);
      const whatsappUrl = `whatsapp://send?text=${message}`;

      const canOpen = await Linking.canOpenURL(whatsappUrl);

      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        return true;
      } else {
        throw new Error("WhatsApp is not installed on this device");
      }
    } catch (error) {
      console.error("Error sharing via WhatsApp:", error);
      throw error;
    }
  }

  // Share via WhatsApp with PDF attachment (mobile only)
  async shareViaWhatsAppPDF(bill: Bill): Promise<boolean> {
    try {
      if (Platform.OS === "web") {
        // On web, just download the PDF and show WhatsApp web link
        await this.generatePDF(bill);
        const message = this.generateWhatsAppMessage(bill);
        const whatsappWebUrl = `https://web.whatsapp.com/send?text=${message}`;
        
        if (typeof window !== "undefined") {
          window.open(whatsappWebUrl, "_blank");
        }
        return true;
      }

      // On mobile, generate PDF and share via WhatsApp
      const pdfResult = await this.generatePDF(bill);

      // Check if WhatsApp is installed
      const whatsappUrl = "whatsapp://send";
      const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);

      if (!canOpenWhatsApp) {
        throw new Error("WhatsApp is not installed on this device");
      }

      // Share the PDF - user can select WhatsApp from share sheet
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfResult.uri, {
          mimeType: "application/pdf",
          dialogTitle: `Share bill via WhatsApp`,
        });
        return true;
      } else {
        throw new Error("Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Error sharing via WhatsApp with PDF:", error);
      throw error;
    }
  }

  // Generate WhatsApp message text
  private generateWhatsAppMessage(bill: Bill): string {
    let message = `*🚗 AKR WORKSHOP BILL*\n\n`;
    message += `*Customer:* ${bill.customerName}\n`;
    message += `*Vehicle:* ${bill.vehicleNumber}\n`;
    
    if (bill.vehicleName && bill.vehicleName.trim()) {
      message += `*Model:* ${bill.vehicleName}\n`;
    }
    
    message += `*Date:* ${new Date(bill.createdAt).toLocaleDateString("en-IN")}\n`;

    if (bill.workDescription) {
      message += `\n*Work Description:*\n${bill.workDescription}\n`;
    }

    // Work Done section
    if ("workDone" in bill && bill.workDone && bill.workDone.length > 0) {
      message += `\n*Work Done:*\n`;
      bill.workDone.forEach((work: any, index: number) => {
        message += `${index + 1}. ${work.workName} - ₹${work.price.toFixed(2)}\n`;
      });
    }

    // Items section
    if (bill.items && bill.items.length > 0) {
      message += `\n*Spare Parts/Items:*\n`;
      bill.items.forEach((item, index) => {
        const unitDisplay = item.unit ? ` ${item.unit}` : "";
        message += `${index + 1}. ${item.itemName} - Qty: ${item.quantity}${unitDisplay}, Rate: ₹${item.rate.toFixed(2)}, Amount: ₹${item.amount.toFixed(2)}\n`;
      });
    }

    message += `\n*TOTAL AMOUNT:* ₹${bill.totalAmount.toFixed(2)}\n`;
    
    if (bill.advanceAmount > 0) {
      message += `*ADVANCE PAID:* ₹${bill.advanceAmount.toFixed(2)}\n`;
    }
    
    message += `*BALANCE DUE:* ₹${bill.balanceAmount.toFixed(2)}\n`;
    message += `\nThank you for your business!`;

    return encodeURIComponent(message);
  }
}

export const pdfService = new PDFService();
