import { Response } from "express";
import * as Excel from "exceljs";
import * as lodash from "lodash";

export class ExcelService {
  async exportToExcel(data: any[], fileName: string, res: Response) {
    // Create a new workbook and worksheet
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Data");

    // If data is empty, return
    if (!data.length) {
      throw new Error("No data to export");
    }

    // Function to flatten object with nested properties
    const flattenObject = (obj: any, prefix = "") => {
      return Object.keys(obj).reduce((acc, key) => {
        const prefixKey = prefix ? `${prefix}_${key}` : key;

        if (
          obj[key] &&
          typeof obj[key] === "object" &&
          !Array.isArray(obj[key])
        ) {
          return { ...acc, ...flattenObject(obj[key], key) };
        }

        return { ...acc, [prefixKey]: obj[key] };
      }, {});
    };

    // Flatten the data
    const flattenedData = data.map((item) => flattenObject(item));

    // Set up the headers using the keys from the first flattened object
    const headers = Object.keys(flattenedData[0]).map((key) => {
      // Convert header to more readable format
      // e.g., "user_fullName" becomes "USER FULL NAME"
      return lodash.upperCase(key.replace(/_/g, " "));
    });
    worksheet.addRow(headers);

    // Add the data rows
    flattenedData.forEach((item) => {
      const row = [];
      Object.keys(item).forEach((key) => {
        const value = item[key];
        row.push(value || "");
      });
      worksheet.addRow(row);
    });

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF999999" },
    };

    // Set column widths - Fixed version
    headers.forEach((header, i) => {
      let maxLength = header.length;

      // Find the longest content in the column
      flattenedData.forEach((row) => {
        const key = Object.keys(row)[i];
        const cellValue = row[key]?.toString() || "";
        maxLength = Math.max(maxLength, cellValue.length);
      });

      // Set column width with some padding
      worksheet.getColumn(i + 1).width = maxLength + 2;
    });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName}.xlsx`,
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  }
}
