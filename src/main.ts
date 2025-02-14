import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import * as cookieParser from "cookie-parser";
import helmet from "helmet";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as path from "path";

import { AppModule } from "./app.module";
import { ResponseHandlerInterceptor } from "@/interceptors/response-handler.interceptor";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { appConfig } from "@/config/app.config";
import { loadSwaggerConfigs } from "@/config/swagger.config";
import { helmetConfigs } from "@/config/helmet.config";
import { HttpExceptionsFilter } from "@/filters/http-exceptions.filter";

const { port, isProduction, allowedOrigins } = appConfig();

async function bootstrap() {
  const logger = new CustomLogger();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const { httpAdapter } = app.get(HttpAdapterHost);

  // Add cookie parser
  app.use(cookieParser());

  // Fix the path to point to the project root's public folder instead of dist
  const publicPath = path.join(process.cwd(), "public");

  app.useStaticAssets(publicPath, {
    prefix: "/static/", // Using a prefix for clarity
  });

  // Enable cors
  app.enableCors({
    origin: allowedOrigins,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Content-Length",
      "Content-Disposition",
    ],
    exposedHeaders: ["Set-Cookie"],
    credentials: true,
  });

  // Add security headers
  app.use(helmet(helmetConfigs));

  // Set global prefix
  app.setGlobalPrefix("api");

  // Enable versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  // Add global pipes
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Add global interceptors
  app.useGlobalInterceptors(new ResponseHandlerInterceptor());

  // Add global filters
  app.useGlobalFilters(new HttpExceptionsFilter(httpAdapter));

  // Load swagger integration for development environment
  !isProduction && loadSwaggerConfigs(app);

  // Start server
  await app.listen(port, () => {
    logger.info(`Server is running on port: ${LoggerPlaceHolder.String}`, port);
    !isProduction &&
      // eslint-disable-next-line no-console
      console.log(
        `Swagger docs is running on port: http://localhost:${port}/docs`,
      );
  });
}

bootstrap();
