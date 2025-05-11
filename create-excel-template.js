// Creating Excel sheet with provided headers using SheetJS
import * as XLSX from 'xlsx';

// Define the headers
const headers = [
  "Implementing Partner Name",
  "Enterprise Name",
  "Enterprise Unique Identifier",
  "Enterprise Owner",
  "Enterprise Owner Date of Birth",
  "Enterprise Owner Sex",
  "Enterprise Type",
  "Enterprise Size",
  "Name of Sub-partners",
  "Total Number of Youth in Work Reported",
  "Number of Youth in Work who are Refugees",
  "Number of Youth in Work who are IDPs",
  "Number of Youth in Work who are from Host Communities",
  "Number of Youth in Work who are PLWDs",
  "Sector",
  "Primary Phone Number",
  "Additional Phone Number 1",
  "Additional Phone Number 2",
  "Email",
  "Country",
  "Administrative Level1",
  "Administrative Level2",
  "Administrative Level3",
  "Administrative Level4",
  "Administrative Level5",
  "Start Date with Implementing Partner (MM/DD/YYYY)",
  "Program Name",
  "Program Details",
  "Program Contact Person",
  "Program Contact Phone Number",
  "New Data Submission"
];

// Create a new workbook and worksheet
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet([headers]);

// Set column widths (approximate values)
const colWidths = headers.map(header => ({ width: Math.max(header.length, 20) }));
worksheet['!cols'] = colWidths;

// Add the worksheet to the workbook
XLSX.utils.book_append_sheet(workbook, worksheet, "Enterprise Data");

// Function to download the Excel file
function downloadExcel() {
  XLSX.writeFile(workbook, "Enterprise_Data_Submission_Template.xlsx");
}

// Call the download function
downloadExcel();