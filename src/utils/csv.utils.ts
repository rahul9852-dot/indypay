import { Parser } from "@json2csv/plainjs";

export const getCsv = (
  data: any[],
  fields: { label: string; value: string }[],
) => {
  try {
    const parser = new Parser({ fields });

    return parser.parse(data);
  } catch (err) {
    return null;
  }
};
