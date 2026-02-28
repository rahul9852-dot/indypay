import { DataSource, DataSourceOptions } from "typeorm";
import { appConfig } from "./app.config";

const {
  database: { host, port, name, password, username },
  isProduction,
} = appConfig();

export const migrationConfig: DataSourceOptions = {
  type: "postgres",
  host,
  port: +port,
  username,
  password,
  database: name,
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/../migrations/*{.ts,.js}"],
  migrationsTableName: "migrations",
  synchronize: false,
  migrationsRun: false,
  logging: !isProduction,
  // Disable SSL when using PgBouncer (server does not support SSL connections).
  // Re-enable if connecting directly to PostgreSQL with SSL (e.g. managed DB).
  ssl: false,
};

const dataSource = new DataSource(migrationConfig);

export default dataSource;
