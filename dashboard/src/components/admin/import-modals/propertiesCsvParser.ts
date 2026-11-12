export interface ParsedPropertyRow {
  name: string;
  location: string;
  monthlyPrice: string;
  onboardingDate: string;
  mainPhone: string;
  managementGroup: string;
  e911Status: string;
  rayBaumStatus: string;
  gmName: string;
  gmEmail: string;
  isValid: boolean;
  validationError?: string;
  rawObj: Record<string, string>;
}

export const REQUIRED_HEADERS = [
  'Property Name',
  'Property Location',
  'Monthly price',
  'Onboarding Date',
  'Main Phone no',
  'Management group',
  'E911 Status',
  "Ray Baum and Kari's law",
  'GM Name',
  'GM email',
];

export function downloadPropertiesTemplate() {
  const csvContent =
    `${REQUIRED_HEADERS.join(',')}\n` +
    `"Grand Hyatt Downtown","123 Michigan Ave, Chicago, IL 60601",1450.00,"2026-03-01","+1 (312) 555-0199","Marriott Hospitality Group","Verified","Active","John Doe","jdoe@hotelchain.com"\n` +
    `"Hilton Garden Inn Airport","456 Airport Way, Miami, FL 33142",1200.00,"2026-06-15","+1 (305) 555-0188","Hilton Worldwide","Verified","Active","Sarah Smith","ssmith@hilton.com"\n` +
    `"Marriott Resort & Spa","789 Ocean Blvd, San Diego, CA 92109",1850.00,"2026-04-10","+1 (619) 555-0177","Marriott Hospitality Group","Verified","Active","Robert Taylor","rtaylor@marriott.com"`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'properties_import_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parsePropertiesCsv(text: string): { rows: ParsedPropertyRow[]; error: string | null } {
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
        error: 'The uploaded file must contain a header row and at least one property data row.',
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

    const rows: ParsedPropertyRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseRow(lines[i]);
      if (cells.every((c) => !c)) continue;

      const rowObj: Record<string, string> = {};
      headers.forEach((h, colIdx) => {
        rowObj[h] = cells[colIdx] ? cells[colIdx].replace(/^["']|["']$/g, '').trim() : '';
      });

      const name = getVal(rowObj, ['Property Name', 'PropertyName', 'property_name', 'Name', 'name']);
      const location = getVal(rowObj, ['Property Location', 'PropertyLocation', 'property_location', 'Location', 'location', 'Address', 'address']);
      const monthlyPrice = getVal(rowObj, ['Monthly price', 'MonthlyPrice', 'monthly_price', 'Price', 'price', 'MRR']);
      const onboardingDate = getVal(rowObj, ['Onboarding Date', 'OnboardingDate', 'onboarding_date', 'Onboarding date', 'Onboard Date', 'Date', 'date']);
      const mainPhone = getVal(rowObj, ['Main Phone no', 'Main Phone No', 'MainPhoneNo', 'main_phone_no', 'Main Phone', 'Phone']);
      const managementGroup = getVal(rowObj, ['Management group', 'Management Group', 'ManagementGroup', 'management_group', 'Organization', 'Group']);
      const e911Status = getVal(rowObj, ['E911 Status', 'E911Status', 'e911_status', 'E911']);
      const rayBaumStatus = getVal(rowObj, ["Ray Baum and Kari's law", "Ray Baum and Kary's law", "ay Baum and Kary's law", 'Ray Baum', 'ray_baum']);
      const gmName = getVal(rowObj, ['GM Name', 'GMName', 'gm_name', 'General Manager Name']);
      const gmEmail = getVal(rowObj, ['GM email', 'GMEmail', 'gm_email', 'General Manager Email']);

      const isValid = Boolean(name.trim());
      const validationError = !name.trim() ? 'Missing Property Name' : undefined;

      rows.push({
        name,
        location: location || 'Address pending',
        monthlyPrice: monthlyPrice || '—',
        onboardingDate: onboardingDate || '—',
        mainPhone: mainPhone || '—',
        managementGroup: managementGroup || 'Unassigned',
        e911Status: e911Status || 'Verified',
        rayBaumStatus: rayBaumStatus || 'Active',
        gmName: gmName || '—',
        gmEmail: gmEmail || '—',
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
