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
  Footer,
  VerticalAlign,
  ShadingType
} from "docx";
import FileSaver from "file-saver";
import { DailyReportItem } from "../types";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export const generateWordDocument = async (
  items: DailyReportItem[],
  contractorName: string,
  supervisorName: string,
  reportMonthDate: Date // Any date within the reported month
) => {
  const monthName = format(reportMonthDate, 'MM', { locale: pl });
  const year = format(reportMonthDate, 'yyyy', { locale: pl });
  const fullMonthName = format(reportMonthDate, 'LLLL', { locale: pl }); // e.g. wrzesień

  const orangeColor = "FF6600"; // Orange brand color
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
          children: [new Paragraph({ text: Math.round(item.totalHours).toString(), style: "TableText" })], // Rounding as per screenshot example
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
          run: {
            font: "Arial",
            size: 22, // 11pt
          },
        },
        {
          id: "TableHeader",
          name: "Table Header",
          basedOn: "Normal",
          run: {
            bold: true,
            size: 22, // 11pt
          },
          paragraph: {
            alignment: AlignmentType.LEFT,
          },
        },
        {
          id: "TableText",
          name: "Table Text",
          basedOn: "Normal",
          run: {
            size: 22, // 11pt
          },
          paragraph: {
            spacing: { before: 50, after: 50 }, // Slight padding
          },
        },
        {
          id: "TableBold",
          name: "Table Bold",
          basedOn: "Normal",
          run: {
            bold: true,
            size: 22,
          },
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
                                        children: [
                                            new TextRun({
                                                text: "Pracownicze Towarzystwo\nEmerytalne",
                                                bold: true,
                                                size: 20
                                            })
                                        ]
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
              new Paragraph({ text: "", spacing: { after: 400 } }), // Spacing
            ],
          }),
        },
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: "Zestawienie czynności wykonanych w miesiącu ",
                bold: true,
                size: 28,
              }),
              new TextRun({
                text: `${monthName}/${year}`,
                bold: true,
                size: 28,
                underline: {},
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Main Table
          table,

          new Paragraph({ text: "", spacing: { after: 600 } }), // Spacing

          // Signatures
          new Paragraph({
            children: [
                new TextRun({ text: contractorName, bold: false }),
            ],
            spacing: { after: 100 }
          }),
           new Paragraph({
            children: [
                new TextRun({ text: "___________________________________________" }),
            ],
            spacing: { after: 50 }
          }),
           new Paragraph({
            children: [
                new TextRun({ text: "Podpis Kontrahenta", size: 18 }),
            ],
            spacing: { after: 400 }
          }),
          
          new Paragraph({
            children: [
                new TextRun({ text: "___________________________________________" }),
            ],
            spacing: { after: 50 }
          }),
          new Paragraph({
            children: [
                new TextRun({ text: `Podpis osoby akceptującej zestawienie w imieniu ${supervisorName || 'PTE'}`, size: 18 }),
            ],
          }),
          
          // Bottom Page Number Simulation
           new Paragraph({
            children: [
                new TextRun({ text: "Strona 1 z 1", size: 16 }),
            ],
            alignment: AlignmentType.RIGHT,
             spacing: { before: 600 }
          }),
           new Paragraph({
            children: [
                new TextRun({ text: "B2B", size: 16 }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  FileSaver.saveAs(blob, `Raport_Czynnosci_${year}_${monthName}.docx`);
};