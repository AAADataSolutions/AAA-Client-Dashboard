import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export interface PartnerInvoicePdfInput {
  invoice_number: string;
  created_at?: string;
  period_start: string;
  period_end: string;
  status?: string;
  total_properties: number;
  gross_revenue: number;
  commission_amount: number;
  notes?: string;
  partner: {
    name: string;
    email: string;
    phone?: string | null;
    company_name?: string | null;
  };
  line_items: Array<{
    property_name: string;
    address?: string;
    property_location?: string;
    monthly_price: number;
    commission_rate: number;
    commission_amount: number;
  }>;
}

/**
 * Generates an official Letter-sized Partner Invoice PDF Buffer matching the portal statement layout.
 */
export async function generatePartnerInvoicePdfBuffer(data: PartnerInvoicePdfInput): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612; // Letter width (8.5in * 72)
  const pageHeight = 792; // Letter height (11in * 72)
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Color palette matching the dashboard print view
  const slate900 = rgb(0.06, 0.09, 0.16);
  const slate700 = rgb(0.2, 0.25, 0.33);
  const slate500 = rgb(0.39, 0.45, 0.55);
  const slate400 = rgb(0.58, 0.64, 0.72);
  const slate200 = rgb(0.89, 0.91, 0.94);
  const slate100 = rgb(0.95, 0.96, 0.98);
  const slate50 = rgb(0.97, 0.98, 0.99);
  const blue600 = rgb(0.15, 0.39, 0.92);
  const emerald600 = rgb(0.02, 0.59, 0.41);

  // Try embedding logo from public/logo.png
  let logoHeightUsed = 0;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const scale = 30 / logoImage.height;
      const logoDims = { width: logoImage.width * scale, height: 30 };
      page.drawImage(logoImage, {
        x: margin,
        y: y - logoDims.height,
        width: logoDims.width,
        height: logoDims.height,
      });
      logoHeightUsed = logoDims.height + 6;
    }
  } catch {
    // Continue gracefully without logo image if unavailable
  }

  // Left Header: Company Details
  const leftStartY = y - logoHeightUsed;
  page.drawText('AAA Data Solutions', {
    x: margin,
    y: leftStartY - 12,
    size: 14,
    font: fontBold,
    color: slate900,
  });
  page.drawText('Telecommunications & Voice Line Services', {
    x: margin,
    y: leftStartY - 26,
    size: 9.5,
    font: fontRegular,
    color: slate500,
  });
  page.drawText('billing@aaadatasolutions.com', {
    x: margin,
    y: leftStartY - 39,
    size: 9.5,
    font: fontRegular,
    color: slate500,
  });

  // Right Header: PARTNER INVOICE Metadata
  const titleText = 'PARTNER INVOICE';
  const titleWidth = fontBold.widthOfTextAtSize(titleText, 16);
  page.drawText(titleText, {
    x: pageWidth - margin - titleWidth,
    y: y - 14,
    size: 16,
    font: fontBold,
    color: slate900,
  });

  const invNumText = String(data.invoice_number || '').replace(/[^\x20-\x7E]/g, '');
  const invNumWidth = fontBold.widthOfTextAtSize(invNumText, 11);
  page.drawText(invNumText, {
    x: pageWidth - margin - invNumWidth,
    y: y - 30,
    size: 11,
    font: fontBold,
    color: blue600,
  });

  const formattedDate = data.created_at
    ? new Date(data.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
  const dateText = `Date: ${formattedDate}`;
  const dateWidth = fontRegular.widthOfTextAtSize(dateText, 9.5);
  page.drawText(dateText, {
    x: pageWidth - margin - dateWidth,
    y: y - 45,
    size: 9.5,
    font: fontRegular,
    color: slate500,
  });

  const periodText = `Period: ${data.period_start} to ${data.period_end}`;
  const periodWidth = fontRegular.widthOfTextAtSize(periodText, 9.5);
  page.drawText(periodText, {
    x: pageWidth - margin - periodWidth,
    y: y - 58,
    size: 9.5,
    font: fontRegular,
    color: slate500,
  });

  y = Math.min(leftStartY - 52, y - 72);

  // Header Divider Line
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 1.5,
    color: slate200,
  });

  y -= 18;

  // Summary Box
  const summaryBoxHeight = 84;
  page.drawRectangle({
    x: margin,
    y: y - summaryBoxHeight,
    width: contentWidth,
    height: summaryBoxHeight,
    color: slate50,
    borderColor: slate200,
    borderWidth: 1,
  });

  const boxPadX = margin + 14;
  let leftBoxY = y - 16;

  page.drawText('PAYABLE TO (PARTNER):', {
    x: boxPadX,
    y: leftBoxY,
    size: 8.5,
    font: fontBold,
    color: slate500,
  });
  leftBoxY -= 15;

  const partnerNameClean = String(data.partner.name || 'Channel Partner').replace(/[^\x20-\x7E]/g, '');
  page.drawText(partnerNameClean, {
    x: boxPadX,
    y: leftBoxY,
    size: 11.5,
    font: fontBold,
    color: slate900,
  });
  leftBoxY -= 13;

  if (data.partner.company_name) {
    const companyClean = String(data.partner.company_name).replace(/[^\x20-\x7E]/g, '');
    page.drawText(companyClean, {
      x: boxPadX,
      y: leftBoxY,
      size: 9.5,
      font: fontBold,
      color: slate700,
    });
    leftBoxY -= 12;
  }

  const emailClean = String(data.partner.email || '').replace(/[^\x20-\x7E]/g, '');
  page.drawText(emailClean, {
    x: boxPadX,
    y: leftBoxY,
    size: 9.5,
    font: fontRegular,
    color: slate500,
  });
  leftBoxY -= 12;

  if (data.partner.phone) {
    const phoneClean = String(data.partner.phone).replace(/[^\x20-\x7E]/g, '');
    page.drawText(phoneClean, {
      x: boxPadX,
      y: leftBoxY,
      size: 9.5,
      font: fontRegular,
      color: slate500,
    });
  }

  // Right side of Summary Box
  let rightBoxY = y - 16;
  const rightEdge = pageWidth - margin - 14;

  const drawRightAligned = (
    text: string,
    posY: number,
    size: number,
    fontToUse: typeof fontRegular,
    colorToUse = slate700
  ) => {
    const clean = String(text).replace(/[^\x20-\x7E]/g, '');
    const w = fontToUse.widthOfTextAtSize(clean, size);
    page.drawText(clean, {
      x: rightEdge - w,
      y: posY,
      size,
      font: fontToUse,
      color: colorToUse,
    });
  };

  drawRightAligned('INVOICE SUMMARY:', rightBoxY, 8.5, fontBold, slate500);
  rightBoxY -= 15;
  drawRightAligned(`Properties Included: ${data.total_properties || 0}`, rightBoxY, 9.5, fontBold, slate900);
  rightBoxY -= 14;
  drawRightAligned(
    `Total Gross Revenue: $${Number(data.gross_revenue || 0).toFixed(2)}`,
    rightBoxY,
    9.5,
    fontBold,
    slate900
  );
  rightBoxY -= 14;
  drawRightAligned(
    `Status: ${String(data.status || 'SUBMITTED').toUpperCase()}  |  Terms: Net 30 Days`,
    rightBoxY,
    9,
    fontRegular,
    slate700
  );

  y -= summaryBoxHeight + 20;

  // Table Header helper
  const colPropX = margin + 10;
  const colSubRightX = margin + contentWidth * 0.58;
  const colRateRightX = margin + contentWidth * 0.76;
  const colCommRightX = pageWidth - margin - 10;

  const drawTableHeader = (topY: number) => {
    const headerH = 24;
    page.drawRectangle({
      x: margin,
      y: topY - headerH,
      width: contentWidth,
      height: headerH,
      color: slate100,
      borderColor: slate200,
      borderWidth: 1,
    });

    const textY = topY - 15;
    page.drawText('PROPERTY / LOCATION', {
      x: colPropX,
      y: textY,
      size: 8.5,
      font: fontBold,
      color: slate700,
    });

    const subHdr = 'MONTHLY SUBSCRIPTION';
    page.drawText(subHdr, {
      x: colSubRightX - fontBold.widthOfTextAtSize(subHdr, 8.5),
      y: textY,
      size: 8.5,
      font: fontBold,
      color: slate700,
    });

    const rateHdr = 'REVENUE SHARE';
    page.drawText(rateHdr, {
      x: colRateRightX - fontBold.widthOfTextAtSize(rateHdr, 8.5),
      y: textY,
      size: 8.5,
      font: fontBold,
      color: slate700,
    });

    const commHdr = 'REVENUE SHARE AMOUNT';
    page.drawText(commHdr, {
      x: colCommRightX - fontBold.widthOfTextAtSize(commHdr, 8.5),
      y: textY,
      size: 8.5,
      font: fontBold,
      color: slate700,
    });

    return topY - headerH;
  };

  y = drawTableHeader(y);

  // Table Rows
  const items = data.line_items || [];
  if (items.length === 0) {
    const emptyRowH = 28;
    page.drawText('Consolidated Partner Portfolio Statement', {
      x: colPropX,
      y: y - 17,
      size: 9.5,
      font: fontRegular,
      color: slate500,
    });
    page.drawLine({
      start: { x: margin, y: y - emptyRowH },
      end: { x: pageWidth - margin, y: y - emptyRowH },
      thickness: 0.75,
      color: slate200,
    });
    y -= emptyRowH;
  } else {
    for (const item of items) {
      const locText = String(item.address || item.property_location || '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim();
      const rowHeight = locText ? 32 : 24;

      if (y - rowHeight < margin + 120) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
        y = drawTableHeader(y);
      }

      const propName = String(item.property_name || 'Assigned Property')
        .replace(/[^\x20-\x7E]/g, '')
        .substring(0, 48);
      page.drawText(propName, {
        x: colPropX,
        y: y - 13,
        size: 9.5,
        font: fontBold,
        color: slate900,
      });

      if (locText) {
        page.drawText(locText.substring(0, 65), {
          x: colPropX,
          y: y - 24,
          size: 8,
          font: fontRegular,
          color: slate500,
        });
      }

      const priceStr = `$${Number(item.monthly_price || 0).toFixed(2)}`;
      page.drawText(priceStr, {
        x: colSubRightX - fontBold.widthOfTextAtSize(priceStr, 9.5),
        y: y - 15,
        size: 9.5,
        font: fontBold,
        color: slate900,
      });

      const rateStr = `${Number(item.commission_rate || 0)}%`;
      page.drawText(rateStr, {
        x: colRateRightX - fontBold.widthOfTextAtSize(rateStr, 9.5),
        y: y - 15,
        size: 9.5,
        font: fontBold,
        color: blue600,
      });

      const commStr = `$${Number(item.commission_amount || 0).toFixed(2)}`;
      page.drawText(commStr, {
        x: colCommRightX - fontBold.widthOfTextAtSize(commStr, 9.5),
        y: y - 15,
        size: 9.5,
        font: fontBold,
        color: emerald600,
      });

      page.drawLine({
        start: { x: margin, y: y - rowHeight },
        end: { x: pageWidth - margin, y: y - rowHeight },
        thickness: 0.75,
        color: slate200,
      });

      y -= rowHeight;
    }
  }

  y -= 18;

  // Ensure enough space for footer cards
  if (y < margin + 110) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  }

  const cardHeight = 68;
  const leftCardWidth = contentWidth * 0.53;
  const rightCardWidth = contentWidth * 0.44;
  const rightCardX = margin + contentWidth - rightCardWidth;

  // Remittance Notes Card
  page.drawRectangle({
    x: margin,
    y: y - cardHeight,
    width: leftCardWidth,
    height: cardHeight,
    color: slate50,
    borderColor: slate200,
    borderWidth: 1,
  });

  page.drawText('REMITTANCE NOTES:', {
    x: margin + 12,
    y: y - 16,
    size: 8.5,
    font: fontBold,
    color: slate500,
  });

  const notesStr = String(data.notes || 'Standard electronic payout remittance.')
    .replace(/[^\x20-\x7E]/g, '')
    .substring(0, 120);
  page.drawText(notesStr, {
    x: margin + 12,
    y: y - 32,
    size: 9,
    font: fontRegular,
    color: slate700,
    maxWidth: leftCardWidth - 24,
    lineHeight: 12,
  });

  // Totals Card
  page.drawRectangle({
    x: rightCardX,
    y: y - cardHeight,
    width: rightCardWidth,
    height: cardHeight,
    color: slate50,
    borderColor: slate200,
    borderWidth: 1,
  });

  page.drawText('Gross Volume:', {
    x: rightCardX + 12,
    y: y - 18,
    size: 9.5,
    font: fontRegular,
    color: slate700,
  });

  const grossValStr = `$${Number(data.gross_revenue || 0).toFixed(2)}`;
  page.drawText(grossValStr, {
    x: rightCardX + rightCardWidth - 12 - fontBold.widthOfTextAtSize(grossValStr, 9.5),
    y: y - 18,
    size: 9.5,
    font: fontBold,
    color: slate900,
  });

  page.drawLine({
    start: { x: rightCardX + 12, y: y - 30 },
    end: { x: rightCardX + rightCardWidth - 12, y: y - 30 },
    thickness: 1,
    color: slate200,
  });

  page.drawText('TOTAL AMOUNT PAYABLE:', {
    x: rightCardX + 12,
    y: y - 48,
    size: 10,
    font: fontBold,
    color: slate900,
  });

  const totalPayableStr = `$${Number(data.commission_amount || 0).toFixed(2)}`;
  page.drawText(totalPayableStr, {
    x: rightCardX + rightCardWidth - 12 - fontBold.widthOfTextAtSize(totalPayableStr, 12),
    y: y - 49,
    size: 12,
    font: fontBold,
    color: emerald600,
  });

  y -= cardHeight + 28;

  // Document Footer
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 0.75,
    color: slate200,
  });

  const footerLine1 = 'AAA Data Solutions Partner Network - All Rights Reserved';
  const footerLine2 = 'Disbursements are processed upon review and approval by AAA Accounts.';

  page.drawText(footerLine1, {
    x: (pageWidth - fontRegular.widthOfTextAtSize(footerLine1, 8.5)) / 2,
    y: y - 14,
    size: 8.5,
    font: fontRegular,
    color: slate400,
  });

  page.drawText(footerLine2, {
    x: (pageWidth - fontRegular.widthOfTextAtSize(footerLine2, 8.5)) / 2,
    y: y - 26,
    size: 8.5,
    font: fontRegular,
    color: slate400,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

