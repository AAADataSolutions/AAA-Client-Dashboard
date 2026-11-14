export interface ParsedDataCircuitRow {
  propertyName: string;
  propertyAddress: string;
  city: string;
  zipCode: string;
  country: string;
  faxNumber: string;
  wholesalerName: string;
  carrier: string;
  bandwidth: string;
  clientPrice: number;
  revenueSharePct: number;
  monthlyRevShareAmt: number;
  stage: string;
  timesPaid: number;
  totalRevenueAdded: number;
  isValid: boolean;
  validationError?: string;
  rawObj: Record<string, string>;
}

export const DATA_CIRCUIT_CSV_HEADERS = [
  'Property Name',
  'Property Address',
  'City',
  'Zip Code',
  'Country',
  'Fax Number',
  'Wholesaler Name',
  'Carrier',
  'Bandwidth',
  'Client Price',
  'Revenue Share',
  'Stage',
  'Number of Times Monthly Revenue Paid',
];

export function downloadDataCircuitsTemplate() {
  const csvContent =
    `${DATA_CIRCUIT_CSV_HEADERS.join(',')}\n` +
    `"Grand Hyatt Downtown","123 Michigan Ave","Chicago","60601","USA","+1 (312) 555-0190","Wholesaler A","AT&T","1 Gig",400.00,"10%","Installed",5\n` +
    `"Hilton Garden Inn Airport","456 Airport Way","Miami","33142","USA","+1 (305) 555-0180","Wholesaler B","Spectrum","500 Mbps",350.00,"12%","Quotation Sent",0\n` +
    `"Marriott Resort & Spa","789 Ocean Blvd","San Diego","92109","USA","+1 (619) 555-0170","Wholesaler A","Verizon","1 Gig",600.00,"15%","Site Survey",2`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'data_circuits_sample_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportDataCircuitsToCsv(circuits: any[], filenamePrefix = 'data-circuits-export') {
  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = circuits.map((c) => {
    const prop = c.property || {};
    const streetAddress = prop.address || c.property_address || '';
    const city = prop.city || c.property_city || '';
    const zip = prop.zip_code || c.property_zip_code || '';
    const country = prop.country || c.property_country || 'USA';
    const fax = prop.fax || c.property_fax || '';
    const wholesaler = c.wholesaler_name || '';
    const carrier = c.carrier_name || '';
    const bandwidth = c.bandwidth || '';
    const clientPrice = Number(c.circuit_monthly_price || 0).toFixed(2);
    const revShare = `${Number(c.revenue_share_percentage || 0)}%`;
    const stage = c.status || 'STARTED';
    const timesPaid = Number(c.times_paid_count ?? (c.current_month_revenue?.revenue_received ? 1 : 0));

    return [
      escapeCsv(c.property_name || prop.name || ''),
      escapeCsv(streetAddress),
      escapeCsv(city),
      escapeCsv(zip),
      escapeCsv(country),
      escapeCsv(fax),
      escapeCsv(wholesaler),
      escapeCsv(carrier),
      escapeCsv(bandwidth),
      escapeCsv(clientPrice),
      escapeCsv(revShare),
      escapeCsv(stage),
      escapeCsv(timesPaid),
    ].join(',');
  });

  const csvContent = `${DATA_CIRCUIT_CSV_HEADERS.join(',')}\n${rows.join('\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function normalizeCircuitStage(raw: string): string {
  const s = (raw || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  if (!s) return 'STARTED';
  if (s.includes('INSTALL') || s === 'LIVE' || s === '7') return 'INSTALLED';
  if (s.includes('FOC') || s === '6') return 'FOC_STAGE';
  if (s.includes('SURVEY') || s === '5') return 'SITE_SURVEY';
  if (s.includes('PAPER') || s.includes('SIGN') || s === '4') return 'PAPERWORK_SIGNED';
  if (s.includes('QUOT') || s.includes('SENT') || s === '3') return 'QUOTATION_SENT';
  if (s.includes('PRIC') || s.includes('FINAL') || s === '2') return 'PRICING_FINALIZED';
  return 'STARTED';
}

export function parseDataCircuitsCsv(text: string): { rows: ParsedDataCircuitRow[]; error: string | null } {
  try {
    const lines: string[] = [];
    let currentLine = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentLine += '""';
          i++;
        } else {
          inQuotes = !inQuotes;
          currentLine += char;
        }
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        if (currentLine.trim()) {
          lines.push(currentLine);
        }
        currentLine = '';
      } else {
        currentLine += char;
      }
    }
    if (currentLine.trim()) {
      lines.push(currentLine);
    }

    if (lines.length < 2) {
      return {
        rows: [],
        error: 'The uploaded CSV must contain a header row and at least one data circuit row.',
      };
    }

    const parseRow = (line: string): string[] => {
      const cells: string[] = [];
      let currentCell = '';
      let inQ = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQ && nextChar === '"') {
            currentCell += '"';
            i++;
          } else {
            inQ = !inQ;
          }
        } else if (char === ',' && !inQ) {
          cells.push(currentCell.trim());
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      cells.push(currentCell.trim());
      return cells;
    };

    const headers = parseRow(lines[0]).map((h) => h.replace(/^["']|["']$/g, '').trim());

    const getVal = (rowObj: Record<string, string>, possibleKeys: string[]) => {
      const normalized = Object.keys(rowObj).reduce((acc, k) => {
        acc[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = rowObj[k];
        return acc;
      }, {} as Record<string, string>);

      for (const k of possibleKeys) {
        const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalized[normK] !== undefined && normalized[normK] !== '') {
          return normalized[normK];
        }
      }
      return '';
    };

    const rows: ParsedDataCircuitRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseRow(lines[i]);
      if (cells.every((c) => !c)) continue;

      const rowObj: Record<string, string> = {};
      headers.forEach((h, colIdx) => {
        rowObj[h] = cells[colIdx] ? cells[colIdx].replace(/^["']|["']$/g, '').trim() : '';
      });

      const propertyName = getVal(rowObj, ['Property Name', 'PropertyName', 'property_name', 'Name']);
      const propertyAddress = getVal(rowObj, ['Property Address', 'PropertyAddress', 'property_address', 'Street Address', 'Address']);
      const city = getVal(rowObj, ['City', 'city']);
      const zipCode = getVal(rowObj, ['Zip Code', 'ZipCode', 'zip_code', 'Zip', 'Postal Code']);
      const country = getVal(rowObj, ['Country', 'country']) || 'USA';
      const faxNumber = getVal(rowObj, ['Fax Number', 'FaxNumber', 'fax_number', 'Fax', 'Apps Number', 'AppsNumber', 'apps_number', 'Phone Number']);
      const wholesalerName = getVal(rowObj, ['Wholesaler Name', 'WholesalerName', 'wholesaler_name', 'Wholesaler']);
      const carrier = getVal(rowObj, ['Carrier', 'carrier', 'Carrier Name', 'carrier_name']);
      const bandwidth = getVal(rowObj, ['Bandwidth', 'bandwidth', 'Speed']);
      const clientPriceRaw = getVal(rowObj, ['Client Price', 'ClientPrice', 'client_price', 'Price', 'Monthly Price']);
      const revenueShareRaw = getVal(rowObj, ['Revenue Share', 'RevenueShare', 'revenue_share', 'Revenue Share %', 'Share']);
      const stageRaw = getVal(rowObj, ['Stage', 'stage', 'Status', 'status']);
      const timesPaidRaw = getVal(rowObj, [
        'Number of Times Monthly Revenue Paid',
        'NumberOfTimesMonthlyRevenuePaid',
        'number_of_times_monthly_revenue_paid',
        'Times Paid',
        'Months Paid',
        'times_paid',
      ]);

      const clientPrice = parseFloat(clientPriceRaw.replace(/[^0-9.]/g, '')) || 0;
      const revenueSharePct = parseFloat(revenueShareRaw.replace(/[^0-9.]/g, '')) || 0;
      const monthlyRevShareAmt = Math.round(clientPrice * (revenueSharePct / 100) * 100) / 100;
      const timesPaid = Math.max(0, parseInt(timesPaidRaw.replace(/[^0-9]/g, ''), 10) || 0);
      const totalRevenueAdded = Math.round(monthlyRevShareAmt * timesPaid * 100) / 100;
      const stage = normalizeCircuitStage(stageRaw);

      const isValid = Boolean(propertyName.trim());
      const validationError = !propertyName.trim() ? 'Missing Property Name' : undefined;

      rows.push({
        propertyName,
        propertyAddress,
        city,
        zipCode,
        country,
        faxNumber,
        wholesalerName,
        carrier,
        bandwidth,
        clientPrice,
        revenueSharePct,
        monthlyRevShareAmt,
        stage,
        timesPaid,
        totalRevenueAdded,
        isValid,
        validationError,
        rawObj: rowObj,
      });
    }

    return { rows, error: null };
  } catch (err: any) {
    return { rows: [], error: err.message || 'Failed to parse CSV file.' };
  }
}

