export interface ParsedPropertyRow {
  name: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  mainPhone: string;
  fax: string;
  organizationName: string;
  gmName: string;
  gmEmail: string;
  gmPhone: string;
  monthlyPricing: string;
  rayBaumStatus: string;
  e911Status: string;
  onboardingDate: string;
  billingStatus: string;
  billingDate: string;
  dataSubjectStatus: string;
  serverName: string;
  vendorName: string;
  isValid: boolean;
  validationError?: string;
  rawObj: Record<string, string>;
}

export const REQUIRED_HEADERS = [
  'Property Name',
  'Street Address',
  'City',
  'State',
  'Zip',
  'Country',
  'Main Phone Number',
  'Fax Number',
  'Organization Name',
  'General Manager Name',
  'General Manager Email',
  'General Manager Phone',
  'Monthly Pricing',
  "Ray Baum and Kari's Law Status",
  'E911 Status',
  'Onboarding Date',
  'Billing Status',
  'Billing Date',
  'Data Subject Status',
  'Server Name',
  'Vendor Name',
];

export function downloadPropertiesTemplate() {
  const csvContent =
    `${REQUIRED_HEADERS.join(',')}\n` +
    `"Grand Hyatt Downtown","123 Michigan Ave","Chicago","IL","60601","USA","+1 (312) 555-0199","+1 (312) 555-0190","Marriott Hospitality Group","John Doe","jdoe@hotelchain.com","+1 (312) 555-0191",1450.00,"Active","Verified","2026-03-01","Billing Done","2026-03-01","Both","Primary PBX 01","Bandwidth"\n` +
    `"Hilton Garden Inn Airport","456 Airport Way","Miami","FL","33142","USA","+1 (305) 555-0188","+1 (305) 555-0180","Hilton Worldwide","Sarah Smith","ssmith@hilton.com","+1 (305) 555-0182",1200.00,"Inactive","Verified","2026-06-15","Billing Pending","","Data Circuited","",""\n` +
    `"Marriott Resort & Spa","789 Ocean Blvd","San Diego","CA","92109","USA","+1 (619) 555-0177","+1 (619) 555-0170","Marriott Hospitality Group","Robert Taylor","rtaylor@marriott.com","+1 (619) 555-0172",1850.00,"Active","Audit Required","2026-04-10","Billing Done","2026-04-10","Ported","",""`;

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
      let streetAddress = getVal(rowObj, ['Street Address', 'StreetAddress', 'street_address', 'Address', 'address', 'Property Location', 'Location']);
      let city = getVal(rowObj, ['City', 'city']);
      let state = getVal(rowObj, ['State', 'state']);
      let zip = getVal(rowObj, ['Zip', 'zip', 'Zip Code', 'zip_code', 'postal_code', 'Postal Code']);
      const country = getVal(rowObj, ['Country', 'country']) || 'USA';
      const mainPhone = getVal(rowObj, ['Main Phone Number', 'MainPhoneNumber', 'main_phone_number', 'Main Phone no', 'Main Phone No', 'MainPhoneNo', 'main_phone_no', 'Main Phone', 'Phone']);
      const fax = getVal(rowObj, ['Fax Number', 'FaxNumber', 'fax_number', 'Fax', 'fax']);
      const organizationName = getVal(rowObj, ['Organization Name', 'OrganizationName', 'organization_name', 'Management group', 'Management Group', 'ManagementGroup', 'management_group', 'Organization', 'Group']);
      const gmName = getVal(rowObj, ['General Manager Name', 'GeneralManagerName', 'general_manager_name', 'GM Name', 'GMName', 'gm_name']);
      const gmEmail = getVal(rowObj, ['General Manager Email', 'GeneralManagerEmail', 'general_manager_email', 'GM email', 'GMEmail', 'gm_email']);
      const gmPhone = getVal(rowObj, ['General Manager Phone', 'GeneralManagerPhone', 'general_manager_phone', 'GM phone', 'GMPhone', 'gm_phone']);
      const monthlyPricing = getVal(rowObj, ['Monthly Pricing', 'MonthlyPricing', 'monthly_pricing', 'Monthly price', 'MonthlyPrice', 'monthly_price', 'Price', 'price', 'MRR']);
      const rayBaumRaw = getVal(rowObj, ["Ray Baum and Kari's Law Status", "Ray Baum and Kari's law", "Ray Baum and Kary's law", "array bomb and carry loss status", "Ray Baum", "ray_baum_status", "ray_baum"]);
      const e911Raw = getVal(rowObj, ['E911 Status', 'E911Status', 'e911_status', 'E911', 'e911']);
      const onboardingDate = getVal(rowObj, ['Onboarding Date', 'OnboardingDate', 'onboarding_date', 'Onboarding date', 'Onboard Date', 'Date']);
      const billingStatusRaw = getVal(rowObj, ['Billing Status', 'BillingStatus', 'billing_status', 'Billing']);
      const billingDate = getVal(rowObj, ['Billing Date', 'BillingDate', 'billing_date', 'Billed Date', 'billed_date']);
      const dataSubjectStatus = getVal(rowObj, ['Data Subject Status', 'DataSubjectStatus', 'data_subject_status', 'Data Circuit Status', 'Connectivity Mode', 'connectivity_type']);
      const serverName = getVal(rowObj, ['Server Name', 'ServerName', 'server_name', 'Server', 'server']);
      const vendorName = getVal(rowObj, ['Vendor Name', 'VendorName', 'vendor_name', 'Vendor', 'vendor']);

      // If streetAddress has commas and city/state/zip are empty, parse it
      if (streetAddress && (!city || !state || !zip) && streetAddress.includes(',')) {
        const parts = streetAddress.split(',').map((p) => p.trim());
        if (parts.length >= 3) {
          streetAddress = parts[0];
          if (!city) city = parts[1];
          const stZip = parts.slice(2).join(' ').trim();
          const match = stZip.match(/([A-Za-z\s]+)\s*(\d{5}(?:-\d{4})?)?/);
          if (!state && match?.[1]) state = match[1].trim();
          if (!zip && match?.[2]) zip = match[2].trim();
        }
      }

      // Determine clean statuses
      const isRayBaumActive =
        rayBaumRaw.toLowerCase().includes('act') ||
        rayBaumRaw.toLowerCase().includes('comp') ||
        rayBaumRaw.toLowerCase() === 'true' ||
        rayBaumRaw.toLowerCase() === 'yes';

      const isE911Verified =
        e911Raw.toLowerCase().includes('verif') ||
        e911Raw.toLowerCase().includes('active') ||
        e911Raw.toLowerCase() === 'true' ||
        e911Raw.toLowerCase() === 'yes';

      const isValid = Boolean(name.trim());
      const validationError = !name.trim() ? 'Missing Property Name' : undefined;

      rows.push({
        name,
        streetAddress: streetAddress || 'Address pending',
        city: city || 'City',
        state: state || 'IL',
        zip: zip || '00000',
        country,
        mainPhone: mainPhone || '—',
        fax: fax || '—',
        organizationName: organizationName || 'Unassigned',
        gmName: gmName || '—',
        gmEmail: gmEmail || '—',
        gmPhone: gmPhone || '—',
        monthlyPricing: monthlyPricing || '0.00',
        rayBaumStatus: isRayBaumActive ? 'Active' : 'Inactive',
        e911Status: isE911Verified ? 'Verified' : 'Audit Required',
        onboardingDate: onboardingDate || '—',
        billingStatus: billingStatusRaw.toLowerCase().includes('done') ? 'Billing Done' : 'Billing Pending',
        billingDate: billingDate || '—',
        dataSubjectStatus: dataSubjectStatus || 'Ported',
        serverName: serverName || '—',
        vendorName: vendorName || '—',
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
