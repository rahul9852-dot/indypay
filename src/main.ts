import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import * as cookieParser from "cookie-parser";
import helmet from "helmet";
import { CustomLogger, LoggerPlaceHolder } from "logger";
import { appConfig } from "config/app.config";
import { loadSwaggerConfigs } from "config/swagger.config";
import { helmetConfigs } from "config/helmet.config";
import { HttpExceptionsFilter } from "filters/http-exceptions.filter";
import { AppModule } from "./app.module";

const { port, isProduction, allowedOrigins } = appConfig();

async function bootstrap() {
  const logger = new CustomLogger();
  const app = await NestFactory.create(AppModule);
  const { httpAdapter } = app.get(HttpAdapterHost);

  // Add security headers
  app.use(helmet(helmetConfigs));

  // Enable cors
  app.enableCors({
    origin: allowedOrigins,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["X-Requested-With", "Content-Type"],
    credentials: true,
  });

  // Add cookie parser
  app.use(cookieParser());

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
  // app.useGlobalInterceptors(new ResponseHandlerInterceptor());

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
