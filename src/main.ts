import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import * as cookieParser from "cookie-parser";
import { CustomLogger, LoggerPlaceHolder } from "logger";
import { appConfig } from "config/app.config";
import { loadSwaggerConfigs } from "config/swagger-configs";
import { HttpExceptionsFilter } from "filters/http-exceptions.filter";
import { ResponseHandlerInterceptor } from "interceptors/response-handler.interceptor";
import { AppModule } from "./app.module";

const { port, isProduction, allowedOrigins } = appConfig();

async function bootstrap() {
  const logger = new CustomLogger();
  const app = await NestFactory.create(AppModule);
  const { httpAdapter } = app.get(HttpAdapterHost);

  app.enableCors({
    origin: allowedOrigins,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["X-Requested-With", "Content-Type"],
    credentials: true,
  });

  app.use(cookieParser());

  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalInterceptors(new ResponseHandlerInterceptor());
  app.useGlobalFilters(new HttpExceptionsFilter(httpAdapter));

  // Load swagger integration for development environment
  !isProduction && loadSwaggerConfigs(app);

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
