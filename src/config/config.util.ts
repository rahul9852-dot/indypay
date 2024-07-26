export const getOsEnv = (key: string, required = true): string => {
  if (typeof process.env[key] === "undefined" && required) {
    throw Error(`Environment variable ${key} is not set.`);
  }

  return process.env[key] ?? "";
};

export const getOsEnvOptional = (key: string): string | undefined => {
  return process.env[key];
};
