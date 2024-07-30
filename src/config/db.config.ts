import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const dbConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: "localhost",
  port: 5433,
  username: "postgres",
  password: "Vivek@123",
  database: "paybolt_pg_db",
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  synchronize: true,
};
