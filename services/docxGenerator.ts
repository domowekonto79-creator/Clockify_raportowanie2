import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Header,
  VerticalAlign,
  ShadingType,
  HeightRule
} from "docx";
import FileSaver from "file-saver";
import { DailyReportItem } from "../types";
import { format, getDaysInMonth, getDate } from "date-fns";
import { pl } from "date-fns/locale";

// --- EXISTING PTE GENERATOR ---
export const generateWordDocument = async (
  items: DailyReportItem[],
  contractorName: string,
  supervisorName: string,
  reportMonthDate: Date
) => {
  const monthName = format(reportMonthDate, 'MM', { locale: pl });
  const year = format(reportMonthDate, 'yyyy', { locale: pl });

  const orangeColor = "FF6600"; 
  const borderColor = "000000";

  // Table Header Row
  const tableHeader = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ text: "Data", style: "TableHeader" })],
        width: { size: 15, type: WidthType.PERCENTAGE },
        shading: { fill: orangeColor, type: ShadingType.CLEAR, color: "auto" },
        verticalAlign: VerticalAlign.CENTER,
      }),
      new TableCell({
        children: [new Paragraph({ text: "Opis", style: "TableHeader" })],
        width: { size: 75, type: WidthType.PERCENTAGE },
        shading: { fill: orangeColor, type: ShadingType.CLEAR, color: "auto" },
        verticalAlign: VerticalAlign.CENTER,
      }),
      new TableCell({
        children: [new Paragraph({ text: "Godziny", style: "TableHeader" })],
        width: { size: 10, type: WidthType.PERCENTAGE },
        shading: { fill: orangeColor, type: ShadingType.CLEAR, color: "auto" },
        verticalAlign: VerticalAlign.CENTER,
      }),
    ],
  });

  // Data Rows
  const dataRows = items.map((item) => {
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: item.date, style: "TableText" })],
          verticalAlign: VerticalAlign.TOP,
        }),
        new TableCell({
          children: [new Paragraph({ text: item.finalDescription, style: "TableText" })],
          verticalAlign: VerticalAlign.TOP,
        }),
        new TableCell({
          children: [new Paragraph({ text: Math.round(item.totalHours).toString(), style: "TableText" })],
          verticalAlign: VerticalAlign.TOP,
        }),
      ],
    });
  });

  // Sum Row
  const totalHours = Math.round(items.reduce((acc, curr) => acc + curr.totalHours, 0));
  const sumRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ text: "Suma:", style: "TableBold" })],
        columnSpan: 2,
        shading: { fill: "EEEEEE", type: ShadingType.CLEAR, color: "auto" },
      }),
      new TableCell({
        children: [new Paragraph({ text: totalHours.toString(), style: "TableBold" })],
        shading: { fill: "EEEEEE", type: ShadingType.CLEAR, color: "auto" },
      }),
    ],
  });

  const table = new Table({
    rows: [tableHeader, ...dataRows, sumRow],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
      left: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
      right: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
    },
  });

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: { font: "Arial", size: 22 },
        },
        {
          id: "TableHeader",
          name: "Table Header",
          basedOn: "Normal",
          run: { bold: true, size: 22 },
          paragraph: { alignment: AlignmentType.LEFT },
        },
        {
          id: "TableText",
          name: "Table Text",
          basedOn: "Normal",
          run: { size: 22 },
          paragraph: { spacing: { before: 50, after: 50 } },
        },
        {
          id: "TableBold",
          name: "Table Bold",
          basedOn: "Normal",
          run: { bold: true, size: 22 },
        },
      ],
    },
    sections: [
      {
        properties: {},
        headers: {
          default: new Header({
            children: [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.NIL },
                    bottom: { style: BorderStyle.NIL },
                    left: { style: BorderStyle.NIL },
                    right: { style: BorderStyle.NIL },
                    insideHorizontal: { style: BorderStyle.NIL },
                    insideVertical: { style: BorderStyle.NIL },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: "Pracownicze Towarzystwo\nEmerytalne", bold: true, size: 20 })]
                                    })
                                ],
                                verticalAlign: VerticalAlign.CENTER
                            }),
                            new TableCell({
                                 children: [
                                    new Paragraph({
                                        text: "Załącznik do Umowy o świadczenie usług",
                                        alignment: AlignmentType.RIGHT,
                                        run: { size: 20 }
                                    })
                                 ],
                                 verticalAlign: VerticalAlign.CENTER
                            })
                        ]
                    })
                ]
              }),
              new Paragraph({ text: "", spacing: { after: 400 } }),
            ],
          }),
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "Zestawienie czynności wykonanych w miesiącu ", bold: true, size: 28 }),
              new TextRun({ text: `${monthName}/${year}`, bold: true, size: 28, underline: {} }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          table,
          new Paragraph({ text: "", spacing: { after: 600 } }),
          new Paragraph({ children: [new TextRun({ text: contractorName, bold: false })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "___________________________________________" })], spacing: { after: 50 } }),
          new Paragraph({ children: [new TextRun({ text: "Podpis Kontrahenta", size: 18 })], spacing: { after: 400 } }),
          new Paragraph({ children: [new TextRun({ text: "___________________________________________" })], spacing: { after: 50 } }),
          new Paragraph({ children: [new TextRun({ text: `Podpis osoby akceptującej zestawienie w imieniu ${supervisorName || 'PTE'}`, size: 18 })] }),
          new Paragraph({ children: [new TextRun({ text: "Strona 1 z 1", size: 16 })], alignment: AlignmentType.RIGHT, spacing: { before: 600 } }),
          new Paragraph({ children: [new TextRun({ text: "B2B", size: 16 })], alignment: AlignmentType.RIGHT }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  FileSaver.saveAs(blob, `Raport_Czynnosci_${year}_${monthName}.docx`);
};

// --- NEW UZ / SECURESIDE GENERATOR ---
export const generateUZDocument = async (
    items: DailyReportItem[],
    contractorName: string,
    reportMonthDate: Date
  ) => {
    const fullMonthName = format(reportMonthDate, 'LLLL', { locale: pl }); // np. Styczeń
    const capitalizedMonth = fullMonthName.charAt(0).toUpperCase() + fullMonthName.slice(1);
    const year = format(reportMonthDate, 'yyyy', { locale: pl });
    const daysInMonth = getDaysInMonth(reportMonthDate);
  
    // Map items for easy lookup by day number
    const itemsMap = new Map<number, number>();
    items.forEach(item => {
        const day = getDate(new Date(item.date));
        itemsMap.set(day, Math.round(item.totalHours));
    });

    const totalHours = Math.round(items.reduce((acc, curr) => acc + curr.totalHours, 0));
  
    // Headers setup
    const headerCellStyles = {
        bold: true,
        size: 20, // 10pt
    };
    const rowCellStyles = {
        size: 20, // 10pt
    };

    // --- TABLE ROWS GENERATION ---
    const tableRows: TableRow[] = [];

    // Header Row
    tableRows.push(new TableRow({
        children: [
            new TableCell({
                children: [new Paragraph({ text: "Dzień miesiąca", alignment: AlignmentType.CENTER, run: headerCellStyles })],
                verticalAlign: VerticalAlign.CENTER,
                width: { size: 15, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
                children: [new Paragraph({ text: "Liczba godzin wykonywania umowy zlecenia", alignment: AlignmentType.CENTER, run: headerCellStyles })],
                verticalAlign: VerticalAlign.CENTER,
                width: { size: 30, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
                children: [new Paragraph({ text: "Uwagi", alignment: AlignmentType.CENTER, run: headerCellStyles })],
                verticalAlign: VerticalAlign.CENTER,
                width: { size: 25, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
                children: [new Paragraph({ text: "Podpis Zleceniobiorcy", alignment: AlignmentType.CENTER, run: headerCellStyles })],
                verticalAlign: VerticalAlign.CENTER,
                width: { size: 30, type: WidthType.PERCENTAGE },
            })
        ]
    }));

    // 1 to 31 (or daysInMonth) Rows
    for (let day = 1; day <= daysInMonth; day++) {
        const hours = itemsMap.get(day);
        tableRows.push(new TableRow({
            height: { value: 300, rule: HeightRule.ATLEAST }, // Ensure some height
            children: [
                new TableCell({
                    children: [new Paragraph({ text: day.toString(), alignment: AlignmentType.CENTER, run: rowCellStyles })],
                    verticalAlign: VerticalAlign.CENTER
                }),
                new TableCell({
                    children: [new Paragraph({ text: hours ? hours.toString() : "", alignment: AlignmentType.CENTER, run: rowCellStyles })],
                    verticalAlign: VerticalAlign.CENTER
                }),
                new TableCell({
                    children: [new Paragraph({ text: "", run: rowCellStyles })],
                    verticalAlign: VerticalAlign.CENTER
                }),
                new TableCell({
                    children: [new Paragraph({ text: "", run: rowCellStyles })],
                    verticalAlign: VerticalAlign.CENTER
                })
            ]
        }));
    }

    // Footer Row (Summary)
    tableRows.push(new TableRow({
        children: [
            new TableCell({
                children: [new Paragraph({ text: "Liczba godzin wykonywania umowy zlecenia ogółem:", alignment: AlignmentType.CENTER, run: { ...headerCellStyles, size: 18 } })],
                verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
                children: [new Paragraph({ text: totalHours.toString(), alignment: AlignmentType.CENTER, run: { ...headerCellStyles, size: 24 } })],
                verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
                children: [new Paragraph({ text: "", run: rowCellStyles })],
                verticalAlign: VerticalAlign.CENTER,
                columnSpan: 2
            })
        ]
    }));

    const table = new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 2 },
            bottom: { style: BorderStyle.SINGLE, size: 2 },
            left: { style: BorderStyle.SINGLE, size: 2 },
            right: { style: BorderStyle.SINGLE, size: 2 },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 2 },
            insideVertical: { style: BorderStyle.SINGLE, size: 2 },
        },
    });
  
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              children: [
                new TextRun({
                  text: "Ewidencja godzin wykonywania umowy zlecenia zawartej",
                  bold: false,
                  size: 32, // 16pt
                }),
                new TextRun({
                  text: " w dniu 5.01.2026",
                  bold: false,
                  size: 32, // 16pt
                  break: 1,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
            }),

            // Month info
            new Paragraph({
                children: [
                  new TextRun({
                    text: `Miesiąc: ${capitalizedMonth} ${year} r.`,
                    size: 24, // 12pt
                  }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { after: 100 },
              }),

            // Name info
            new Paragraph({
                children: [
                  new TextRun({
                    text: `Nazwisko i imię Zleceniobiorcy: ${contractorName}`,
                    size: 24, // 12pt
                  }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { after: 300 },
              }),
  
            // Main Table
            table,
  
            new Paragraph({ text: "", spacing: { after: 400 } }), // Spacing
  
            // Confirmation text
            new Paragraph({
              children: [
                  new TextRun({ text: "Powyższe zestawienie godzin wykonywania umowy potwierdzam: ", size: 20, bold: true }),
                  new TextRun({ text: "...........................................................", size: 20 }),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 50 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "(data i podpis przyjmującego pracę)           ", size: 16 }),
                ],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 400 }
              }),
          ],
        },
      ],
    });
  
    const blob = await Packer.toBlob(doc);
    FileSaver.saveAs(blob, `Ewidencja_Godzin_${year}_${capitalizedMonth}.docx`);
  };