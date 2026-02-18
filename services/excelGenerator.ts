import ExcelJS from 'exceljs';
import FileSaver from 'file-saver';
import { DailyReportItem } from '../types';
import { format, getDaysInMonth, getDate } from 'date-fns';
import { pl } from 'date-fns/locale';

export const generateUZExcel = async (
  items: DailyReportItem[],
  contractorName: string,
  reportMonthDate: Date
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Ewidencja', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true, // Forces content to fit on one page width
      margins: {
        left: 0.5, right: 0.5, top: 0.5, bottom: 0.5,
        header: 0.3, footer: 0.3
      }
    }
  });

  // Date formatting
  const fullMonthName = format(reportMonthDate, 'LLLL', { locale: pl });
  const capitalizedMonth = fullMonthName.charAt(0).toUpperCase() + fullMonthName.slice(1);
  const year = format(reportMonthDate, 'yyyy', { locale: pl });
  const daysInMonth = getDaysInMonth(reportMonthDate);

  // Map items
  const itemsMap = new Map<number, number>();
  items.forEach(item => {
    const day = getDate(new Date(item.date));
    itemsMap.set(day, Math.round(item.totalHours));
  });
  
  // Note: We don't need to pre-calculate totalHours for the cell value anymore, 
  // as we will use an Excel formula.

  // --- COLUMN SETUP (Approx width for A4) ---
  // A: Day (Small)
  // B: Hours (Medium)
  // C: Remarks (Medium)
  // D: Signature (Wide)
  worksheet.columns = [
    { key: 'day', width: 8 },
    { key: 'hours', width: 25 },
    { key: 'remarks', width: 25 },
    { key: 'signature', width: 30 },
  ];

  // --- STYLING HELPERS ---
  const centerStyle: Partial<ExcelJS.Style> = {
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    font: { name: 'Arial', size: 10 }
  };
  
  const boldStyle: Partial<ExcelJS.Style> = {
    font: { name: 'Arial', size: 10, bold: true }
  };

  const borderStyle: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  // --- CONTENT ---

  // 1. Title (Merged)
  worksheet.mergeCells('A1:D1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = "Ewidencja godzin wykonywania umowy zlecenia zawartej w dniu 5.01.2026";
  titleCell.font = { name: 'Arial', size: 12, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  
  worksheet.addRow([]); // Spacer

  // 2. Month Info
  worksheet.mergeCells('A3:D3');
  const monthCell = worksheet.getCell('A3');
  monthCell.value = `Miesiąc: ${capitalizedMonth} ${year} r.`;
  monthCell.font = { name: 'Arial', size: 10 };

  // 3. Contractor Info
  worksheet.mergeCells('A4:D4');
  const nameCell = worksheet.getCell('A4');
  nameCell.value = `Nazwisko i imię Zleceniobiorcy: ${contractorName}`;
  nameCell.font = { name: 'Arial', size: 10 };

  worksheet.addRow([]); // Spacer

  // 4. Table Header
  const headerRow = worksheet.addRow([
    'Dzień miesiąca',
    'Liczba godzin wykonywania umowy zlecenia',
    'Uwagi',
    'Podpis Zleceniobiorcy'
  ]);
  
  headerRow.height = 40;
  headerRow.eachCell((cell) => {
    cell.style = { ...centerStyle, font: { ...boldStyle.font } };
    cell.border = borderStyle;
  });

  // 5. Data Rows (1 to daysInMonth)
  let firstDataRowIndex = 0;
  let lastDataRowIndex = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const hours = itemsMap.get(day);
    
    const row = worksheet.addRow([
      day,
      hours ? hours : null, // Use null to ensure numeric type for formula
      '',
      ''
    ]);
    
    // Capture row indices for the SUM formula
    if (day === 1) firstDataRowIndex = row.number;
    lastDataRowIndex = row.number;

    row.height = 18; // Ensure consistent height
    
    // IMPORTANT: includeEmpty: true ensures borders are applied even if cell value is null/empty
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.style = centerStyle;
      cell.border = borderStyle;
    });
  }

  // 6. Summary Row
  const summaryRow = worksheet.addRow([
    'Liczba godzin wykonywania umowy zlecenia ogółem:',
    '', // Will be filled with formula
    '',
    ''
  ]);
  
  // Adjust height for summary row to fit text
  summaryRow.height = 45;

  const labelCell = summaryRow.getCell(1);
  labelCell.style = { ...centerStyle, font: { ...boldStyle.font } };
  labelCell.border = borderStyle;
  labelCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  const valueCell = summaryRow.getCell(2);
  valueCell.style = { ...centerStyle, font: { ...boldStyle.font, size: 12 } };
  valueCell.border = borderStyle;
  
  // Set the SUM formula
  // Assuming column B (index 2) contains the hours
  if (firstDataRowIndex > 0 && lastDataRowIndex > 0) {
    valueCell.value = { formula: `SUM(B${firstDataRowIndex}:B${lastDataRowIndex})` };
  } else {
    valueCell.value = 0;
  }

  // Empty cells borders
  summaryRow.getCell(3).border = borderStyle;
  summaryRow.getCell(4).border = borderStyle;

  worksheet.addRow([]); // Spacer
  worksheet.addRow([]); // Spacer

  // 7. Footer Confirmation
  const confirmRow = worksheet.addRow(['', '', '', 'Powyższe zestawienie godzin wykonywania']);
  confirmRow.getCell(4).font = { name: 'Arial', size: 9, bold: true };
  confirmRow.getCell(4).alignment = { horizontal: 'center' };

  const confirmRow2 = worksheet.addRow(['', '', '', 'umowy potwierdzam:']);
  confirmRow2.getCell(4).font = { name: 'Arial', size: 9, bold: true };
  confirmRow2.getCell(4).alignment = { horizontal: 'center' };

  worksheet.addRow([]); // Space for signature

  const signRow = worksheet.addRow(['', '', '', '...........................................................']);
  signRow.getCell(4).alignment = { horizontal: 'center' };
  
  const dateSignRow = worksheet.addRow(['', '', '', '(data i podpis przyjmującego pracę)']);
  dateSignRow.getCell(4).font = { name: 'Arial', size: 8 };
  dateSignRow.getCell(4).alignment = { horizontal: 'center', vertical: 'top' };

  // Write Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  FileSaver.saveAs(blob, `Ewidencja_Godzin_${year}_${capitalizedMonth}.xlsx`);
};