export interface ParsedPortingRow {
  client: string;
  propertyName: string;
  propertyPhone: string;
  fax: string;
  monthlyPrice: string;
  channelPartner: string;
  partnerRevShare: string;
  targetDate: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  gmName: string;
  gmPhone: string;
  gmEmail: string;
  stage: string;
  e911Status: string;
  rayBaumStatus: string;
  carrierDetails: string;
  isValid: boolean;
  validationError?: string;
}

export const REQUIRED_HEADERS = [
  'Client',
  'Property Name',
  'Main Phone Number',
  'Fax Number',
  'Monthly Price ($)',
  'Channel Partner',
  'Partner Revenue Share (%)',
  'Target Cutover Date',
  'Street Address',
  'City',
  'State',
  'ZIP Code',
  'GM Full Name',
  'GM Phone Number',
  'GM Email Address',
  'Initial Lifecycle Stage',
  'E911 Compliance Status',
  "Ray Baum & Kari's Law",
  'Losing Carrier & Porting Notes',
];

export function downloadPortingSample() {
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [
      REQUIRED_HEADERS.join(','),
      'Paramount Hospitality Group,Grand Hotel Downtown,(555) 123-4567,(555) 987-6543,249.00,Apex Telecom,15,2026-11-15,742 Evergreen Terrace,Springfield,OR,97477,Sarah Connor,(555) 345-6789,gm@grandhotel.com,Stage 1: Draft initialized,PSAP Verified (Compliant),Active (Compliant),"Losing carrier: Verizon, Account #: 987123847, PIN: 1234"',
      '-- Unassigned (None) --,Magnolia Suites Austin,(512) 555-8822,,189.00,No Partner Assigned,,2026-12-01,100 Congress Ave,Austin,TX,78701,Michael Scott,(512) 555-8833,michael@magnolia.com,Stage 2: Contract sent,Audit Required,Active (Compliant),"Losing carrier: AT&T, PIN: 4321"',
    ].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'sample_porting_records.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parsePortingCsv(text: string): {
  rows: ParsedPortingRow[];
  summary: { total: number; valid: number; invalid: number } | null;
  error: string | null;
} {
  if (!text) {
    return { rows: [], summary: null, error: 'Empty file provided.' };
  }

  const lines = text
    .split(/\r\n|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      rows: [],
      summary: null,
      error: 'CSV must have a header row and at least one data row.',
    };
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headerLine = parseCSVLine(lines[0]);
  const headerMap: Record<string, number> = {};
  headerLine.forEach((h, idx) => {
    headerMap[h.toLowerCase().trim().replace(/[^a-z0-9]/g, '')] = idx;
  });

  const getVal = (rowArr: string[], aliases: string[]) => {
    for (const alias of aliases) {
      const key = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (headerMap[key] !== undefined && rowArr[headerMap[key]] !== undefined) {
        return rowArr[headerMap[key]].replace(/^"|"$/g, '').trim();
      }
    }
    return '';
  };

  const rows: ParsedPortingRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rowArr = parseCSVLine(lines[i]);
    if (rowArr.length === 1 && !rowArr[0]) continue;

    const client = getVal(rowArr, ['Client', 'Management Group', 'Organization', 'Group']);
    const propertyName = getVal(rowArr, ['Property Name', 'Property', 'Name']);
    const propertyPhone = getVal(rowArr, ['Main Phone Number', 'Main Phone', 'Phone Number', 'Phone']);
    const fax = getVal(rowArr, ['Fax Number', 'Fax']);
    const monthlyPrice = getVal(rowArr, ['Monthly Price ($)', 'Monthly Price', 'Monthly', 'Price']);
    const channelPartner = getVal(rowArr, ['Channel Partner', 'Partner', 'Partner Name']);
    const partnerRevShare = getVal(rowArr, ['Partner Revenue Share (%)', 'Partner Revenue Share', 'Partner Share', 'Revenue Share', 'Commission']);
    const targetDate = getVal(rowArr, ['Target Cutover Date', 'Target Date', 'Cutover Date']);
    const streetAddress = getVal(rowArr, ['Street Address', 'Address', 'Street']);
    const city = getVal(rowArr, ['City']);
    const state = getVal(rowArr, ['State']);
    const zipCode = getVal(rowArr, ['ZIP Code', 'Zip Code', 'Zip', 'Zipcode', 'Postal Code']);
    const gmName = getVal(rowArr, ['GM Full Name', 'GM Name', 'General Manager Name', 'General Manager', 'Contact Name']);
    const gmPhone = getVal(rowArr, ['GM Phone Number', 'GM Phone', 'General Manager Phone']);
    const gmEmail = getVal(rowArr, ['GM Email Address', 'GM Email', 'General Manager Email']);
    const stage = getVal(rowArr, ['Initial Lifecycle Stage', 'Lifecycle Stage', 'Stage', 'Status']) || 'Stage 1: Draft initialized';
    const e911Status = getVal(rowArr, ['E911 Compliance Status', 'E911 Status', 'E911']) || 'PSAP Verified (Compliant)';
    const rayBaumStatus = getVal(rowArr, ["Ray Baum & Kari's Law", 'Ray Baum Status', 'Ray Baum']) || 'Active (Compliant)';
    const carrierDetails = getVal(rowArr, ['Losing Carrier & Porting Notes', 'Porting Notes', 'Carrier Details', 'Notes']);

    let isValid = true;
    let validationError = '';

    if (!propertyName) {
      isValid = false;
      validationError = 'Missing Property Name';
    } else if (!propertyPhone) {
      isValid = false;
      validationError = 'Missing Main Phone Number';
    } else if (gmEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmEmail)) {
      isValid = false;
      validationError = 'Invalid GM Email format';
    }

    rows.push({
      client,
      propertyName,
      propertyPhone,
      fax,
      monthlyPrice,
      channelPartner,
      partnerRevShare,
      targetDate,
      streetAddress,
      city,
      state,
      zipCode,
      gmName,
      gmPhone,
      gmEmail,
      stage,
      e911Status,
      rayBaumStatus,
      carrierDetails,
      isValid,
      validationError,
    });
  }

  const validCount = rows.filter((r) => r.isValid).length;
  const summary = {
    total: rows.length,
    valid: validCount,
    invalid: rows.length - validCount,
  };

  return { rows, summary, error: null };
}
