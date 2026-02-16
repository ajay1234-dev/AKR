# Logo Implementation in PDF

## Overview
The logo from `assets/logo.png` is now automatically embedded in all generated PDFs at the top center of the document.

## How It Works

### 1. Logo Loading
The `loadLogo()` method handles loading the logo for both web and mobile platforms:

**Web Platform:**
- Uses `fetch()` to load the image
- Converts to base64 using FileReader API
- Caches the result for subsequent PDF generations

**Mobile Platform (iOS/Android):**
- Uses `expo-asset` to load the local image
- Reads the file as base64 using `expo-file-system`
- Caches the result for performance

### 2. Logo Placement in PDF
- **Position**: Top center of the page
- **Size**: 30mm x 30mm
- **Format**: PNG
- **Spacing**: 5mm gap between logo and business name

### 3. Caching
The logo is loaded once and cached in memory (`this.logoBase64`) to avoid reloading for every PDF generation.

## Code Structure

```typescript
class PDFService {
  private logoBase64: string | null = null;

  async loadLogo(): Promise<string | null> {
    // Load and cache logo as base64
  }

  async generatePDF(bill: Bill): Promise<PDFResult> {
    // Load logo
    const logoBase64 = await this.loadLogo();
    
    // Add logo to PDF if available
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", logoX, yPos, 30, 30);
    }
  }
}
```

## PDF Layout

```
┌─────────────────────────────────┐
│                                 │
│          [LOGO IMAGE]           │  ← 30mm x 30mm, centered
│                                 │
│        AKR WORKSHOP             │  ← Business name
│     123 Main Street...          │  ← Address
│     Phone: +91 9876543210       │  ← Phone
│─────────────────────────────────│
│                                 │
│  Customer: John Doe             │
│  Vehicle: TN 01 AB 1234         │
│  ...                            │
└─────────────────────────────────┘
```

## Error Handling

If the logo fails to load:
- A warning is logged to console
- PDF generation continues without the logo
- No error is thrown to the user

This ensures PDFs are always generated even if the logo is missing or corrupted.

## Customization

To change the logo size, modify these values in `generatePDF()`:

```typescript
const logoWidth = 30;  // Width in mm
const logoHeight = 30; // Height in mm
```

To change the logo position:

```typescript
const logoX = (210 - logoWidth) / 2; // Horizontal position (centered)
const yPos = 15; // Vertical position from top
```

## Testing

### Test on Web:
```bash
npm run web
```
1. Create a bill
2. Click "DOWNLOAD / SHARE PDF"
3. Open the downloaded PDF
4. Verify logo appears at the top center

### Test on Mobile:
```bash
npm run android
# or
npm run ios
```
1. Create a bill
2. Click "DOWNLOAD / SHARE PDF"
3. Share the PDF
4. Open the PDF and verify logo appears

## Dependencies

- `expo-asset`: For loading local assets on mobile
- `expo-file-system`: For reading files as base64
- `jspdf`: For adding images to PDF

All dependencies are already installed in the project.

## Notes

- The logo is loaded asynchronously to avoid blocking PDF generation
- The logo is cached after first load for better performance
- The same logo appears in both PDF and HTML versions of the bill
- Logo format must be PNG for best compatibility
- Recommended logo size: 512x512 pixels or higher for best quality
