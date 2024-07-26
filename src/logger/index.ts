import { sep } from "path";
import { format, createLogger, transports } from "winston";
import { appConfig } from "config/app.config";
import { DateFormat } from "enums";

const { combine, printf, timestamp, colorize, splat, prettyPrint } = format;
const { isProduction } = appConfig();

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

export enum LoggerPlaceHolder {
  Json = "%j",
  Object = "%o",
  String = "%s",
}

const level = () => {
  return isProduction ? "warn" : "debug";
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

const formatLogger = combine(
  colorize({ all: true, colors }),
  timestamp({ format: DateFormat.DD_MM_YYYY_HH_MM_SS_A }),
  splat(),
  prettyPrint(),
  printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
);

export const logger = createLogger({
  level: level(),
  levels,
  format: formatLogger,
  transports: [new transports.Console()],
});

enum LogLevels {
  Debug = "debug",
  Error = "error",
  Info = "info",
  Warn = "warn",
}

const allowedLevels = isProduction
  ? ["error", "warn", "info"]
  : ["error", "warn", "info", "debug"];

export class CustomLogger {
  public static readonly DEFAULT_SCOPE = "App";

  private static parsePathToScope(filepath: string): string {
    let filePath = filepath;
    if (filePath.indexOf(sep) >= 0) {
      filePath = filePath.replace(process.cwd(), "");
      filePath = filePath.replace(`${sep}src${sep}`, "");
      filePath = filePath.replace(`${sep}dist${sep}`, "");
      filePath = filePath.replace(".ts", "");
      filePath = filePath.replace(".js", "");
      filePath = filePath.replace(sep, ":");
    }

    return filePath;
  }

  private scope: string;

  constructor(scope?: string) {
    this.scope = CustomLogger.parsePathToScope(
      scope ?? CustomLogger.DEFAULT_SCOPE,
    );
  }

  public debug(message: string): void {
    this.log(LogLevels.Debug, message);
  }

  public info<T>(message: string, data?: T): void {
    this.log(LogLevels.Info, message, data);
  }

  public warn(message: string): void {
    this.log(LogLevels.Warn, message);
  }

  public error<T>(message: string, error?: T): void {
    this.log(LogLevels.Error, message, error);
  }

  private log<T>(level: string, message: string, data?: T): void {
    if (allowedLevels.includes(level)) {
      const { stack } = new Error();
      const caller = stack ? stack.split("\n")[3]?.split("(")[0]?.trim() : "";
      const callerFn =
        caller && !caller.includes("<anonymous>")
          ? `[${caller.split("/").pop()}]`
          : "";

      logger.log(level, `${this.formatScope()} ${callerFn} ${message}`, data);
    }
  }

  private formatScope(): string {
    return `[${this.scope}]`;
  }
}
