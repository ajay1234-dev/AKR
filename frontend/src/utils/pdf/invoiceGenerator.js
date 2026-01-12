// Note: These imports will be used after installing the packages
// import RNHTMLtoPDF from 'react-native-html-to-pdf';
// import Share from 'react-native-share';
import { Linking, Platform, PermissionsAndroid } from "react-native";

// Function to generate invoice HTML content
export const generateInvoiceHTML = (bill) => {
  const works = bill.billItems.filter((item) => item.itemType === "work");
  const spareParts = bill.billItems.filter(
    (item) => item.itemType === "sparePart"
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Bill</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      line-height: 1.4;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #2196F3;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      color: #2196F3;
      margin: 0;
    }
    .subtitle {
      font-size: 16px;
      font-weight: bold;
      margin: 5px 0;
    }
    .info-container {
      margin: 15px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      padding: 5px 0;
    }
    .label {
      font-weight: bold;
      width: 45%;
    }
    .value {
      text-align: right;
      width: 55%;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      margin: 15px 0 10px 0;
      color: #2196F3;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      padding: 5px 0;
      border-bottom: 1px dashed #eee;
    }
    .item-desc {
      width: 60%;
    }
    .item-amount {
      width: 40%;
      text-align: right;
      font-weight: bold;
    }
    .total-section {
      margin-top: 15px;
      padding-top: 10px;
      border-top: 2px solid #000;
      font-weight: bold;
      font-size: 16px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #ccc;
      padding-top: 15px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">MECHANIC WORKSHOP</div>
    <div class="subtitle">PROFESSIONAL SERVICE BILL</div>
  </div>
  
  <div class="info-container">
    <div class="info-row">
      <span class="label">Bill Number:</span>
      <span class="value">${bill.billNumber}</span>
    </div>
    <div class="info-row">
      <span class="label">Date:</span>
      <span class="value">${new Date(bill.createdAt).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      )}</span>
    </div>
    <div class="info-row">
      <span class="label">Customer Name:</span>
      <span class="value">${bill.customer.name}</span>
    </div>
    <div class="info-row">
      <span class="label">Vehicle Number:</span>
      <span class="value">${bill.customer.vehicleNumber}</span>
    </div>
  </div>
  
  ${
    works.length > 0
      ? `
  <div class="section-title">WORK DONE</div>
  ${works
    .map(
      (work) => `
  <div class="item-row">
    <span class="item-desc">${work.description}</span>
    <span class="item-amount">₹${work.amount.toFixed(2)}</span>
  </div>
  `
    )
    .join("")}
  `
      : ""
  }
  
  ${
    spareParts.length > 0
      ? `
  <div class="section-title">SPARE PARTS</div>
  ${spareParts
    .map(
      (part) => `
  <div class="item-row">
    <span class="item-desc">${part.description}</span>
    <span class="item-amount">₹${part.amount.toFixed(2)}</span>
  </div>
  `
    )
    .join("")}
  `
      : ""
  }
  
  <div class="total-section">
    <div class="total-row">
      <span class="label">Total Amount:</span>
      <span class="value">₹${bill.totalAmount.toFixed(2)}</span>
    </div>
    <div class="total-row">
      <span class="label">Advance Amount:</span>
      <span class="value">₹${bill.advanceAmount.toFixed(2)}</span>
    </div>
    <div class="total-row">
      <span class="label">Balance Amount:</span>
      <span class="value">₹${bill.balanceAmount.toFixed(2)}</span>
    </div>
  </div>
  
  <div class="footer">
    Thank you for choosing our service. Please contact us for any queries.<br>
    Call: [Your Workshop Phone Number]
  </div>
</body>
</html>`;
};

// Function to generate PDF from bill data
export const generateInvoicePDF = async (bill) => {
  try {
    const htmlContent = generateInvoiceHTML(bill);

    const options = {
      html: htmlContent,
      fileName: `Bill_${bill.billNumber}`,
      directory: "Documents",
    };

    const file = await RNHTMLtoPDF.convert(options);
    return file.filePath;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

// Function to generate a text-based bill summary for sharing
export const generateBillSummary = (bill) => {
  const works = bill.billItems.filter((item) => item.itemType === "work");
  const spareParts = bill.billItems.filter(
    (item) => item.itemType === "sparePart"
  );

  let summary = `*MECHANIC WORKSHOP BILL*\n\n`;
  summary += `*Bill Number:* ${bill.billNumber}\n`;
  summary += `*Date:* ${new Date(bill.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}\n\n`;
  summary += `*Customer:* ${bill.customer.name}\n`;
  summary += `*Vehicle:* ${bill.customer.vehicleNumber}\n\n`;

  if (works.length > 0) {
    summary += "*WORKS DONE:*\n";
    works.forEach((work) => {
      summary += `- ${work.description}: ₹${work.amount.toFixed(2)}\n`;
    });
    summary += "\n";
  }

  if (spareParts.length > 0) {
    summary += "*SPARE PARTS:*\n";
    spareParts.forEach((part) => {
      summary += `- ${part.description}: ₹${part.amount.toFixed(2)}\n`;
    });
    summary += "\n";
  }

  summary += `*TOTAL:* ₹${bill.totalAmount.toFixed(2)}\n`;
  summary += `*ADVANCE:* ₹${bill.advanceAmount.toFixed(2)}\n`;
  summary += `*BALANCE:* ₹${bill.balanceAmount.toFixed(2)}\n\n`;
  summary += "Thank you for choosing our service!";

  return encodeURIComponent(summary);
};

// Function to share the bill via WhatsApp using Android intent
export const shareBillOnWhatsApp = async (bill) => {
  try {
    const billSummary = generateBillSummary(bill);
    const whatsappUrl = `whatsapp://send?text=${billSummary}`;

    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      alert("WhatsApp is not installed on your device");
    }
  } catch (error) {
    console.error("Error sharing on WhatsApp:", error);
    alert("Failed to share bill on WhatsApp");
  }
};
