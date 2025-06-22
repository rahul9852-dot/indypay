import * as ExcelJS from "exceljs";
import { Response } from "express";

interface StreamingExcelOptions<T> {
  res: Response;
  sheetName: string;
  header: string[];
  rowMapper: (record: T) => (string | number | Date | null)[];
  batchFetch: (offset: number, limit: number) => Promise<T[]>;
  from?: number;
  count?: number;
  maxRowsPerSheet?: number;
  batchSize?: number;
}

export async function writeRecordsToWorkbookInChunksStreaming<T>({
  res,
  sheetName,
  header,
  rowMapper,
  batchFetch,
  from = 0,
  count,
  maxRowsPerSheet = 1_048_000,
  batchSize = 50_000,
}: StreamingExcelOptions<T>): Promise<void> {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: false,
    useSharedStrings: false,
  });
  let sheetIndex = 1;
  let sheet = workbook.addWorksheet(`${sheetName} ${sheetIndex}`);
  sheet.addRow(header);
  let rowCount = 1;

  let offset = from;
  let totalFetched = 0;

  while (true) {
    const batch = await batchFetch(offset, batchSize);
    if (batch.length === 0) break;

    for (const record of batch) {
      if (count && totalFetched >= count) break;

      if (rowCount >= maxRowsPerSheet) {
        sheet.commit();
        sheetIndex++;
        sheet = workbook.addWorksheet(`${sheetName} ${sheetIndex}`);
        sheet.addRow(header);
        rowCount = 1;
      }

      sheet.addRow(rowMapper(record));
      rowCount++;
      totalFetched++;
    }

    offset += batch.length;
    if (count && totalFetched >= count) break;
    if (batch.length < batchSize) break;
  }

  await sheet.commit();
  await workbook.commit();
}
