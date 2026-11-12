export interface ParsedTechnicianRow {
  name: string;
  area_name: string;
  phone_no: string;
  isValid: boolean;
  validationError?: string;
  rawObj: Record<string, string>;
}

export const REQUIRED_HEADERS = ['Name', 'Area Name', 'Phone No'];

export function downloadTechniciansTemplate() {
  const csvContent =
    'Name,Area Name,Phone No\n' +
    'John Doe,Chicago Metro,+1 (312) 555-0143\n' +
    'Sarah Connor,Miami Beach Metro,+1 (305) 555-0188\n' +
    'Marcus Vance,Dallas North Metro,+1 (214) 555-0199\n' +
    'Elena Rostova,New York Downtown,+1 (212) 555-0177\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'technicians_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseTechniciansCsv(text: string): { rows: ParsedTechnicianRow[]; error: string | null } {
  try {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return {
        rows: [],
        error: 'The uploaded CSV file is empty or missing data rows.',
      };
    }

    const parseRow = (rowStr: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseRow(lines[0]).map((h) => h.replace(/^["']|["']$/g, '').trim());

    const getVal = (rowObj: Record<string, string>, possibleKeys: string[]) => {
      const normalized: Record<string, string> = {};
      for (const [k, v] of Object.entries(rowObj)) {
        const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        normalized[cleanK] = v;
      }
      for (const k of possibleKeys) {
        const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalized[normK] !== undefined && normalized[normK] !== '') {
          return normalized[normK];
        }
      }
      return '';
    };

    const rows: ParsedTechnicianRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseRow(lines[i]);
      if (cells.every((c) => !c)) continue;

      const rowObj: Record<string, string> = {};
      headers.forEach((h, colIdx) => {
        rowObj[h] = cells[colIdx] ? cells[colIdx].replace(/^["']|["']$/g, '').trim() : '';
      });

      const name = getVal(rowObj, ['Name', 'Technician Name', 'technician_name', 'technician', 'Full Name']);
      const area_name = getVal(rowObj, ['Area Name', 'AreaName', 'area_name', 'Area', 'Location', 'City', 'Region']);
      const phone_no = getVal(rowObj, ['Phone No', 'PhoneNo', 'phone_no', 'Phone', 'Phone Number', 'Mobile', 'Tel']);

      let isValid = true;
      let validationError: string | undefined;

      if (!name.trim()) {
        isValid = false;
        validationError = 'Missing Technician Name';
      } else if (!area_name.trim()) {
        isValid = false;
        validationError = 'Missing Area Name';
      } else if (!phone_no.trim()) {
        isValid = false;
        validationError = 'Missing Phone Number';
      }

      rows.push({
        name,
        area_name,
        phone_no,
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
