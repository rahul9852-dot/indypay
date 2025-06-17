import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import * as cookieParser from "cookie-parser";
import helmet from "helmet";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as path from "path";
import { join } from "path";
import * as hbs from "hbs";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { json, urlencoded } from "express";
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

  app.use((req, res, next) => {
    if (req.originalUrl === "/api/v1/payments/payin/webhook") {
      let data = "";
      req.setEncoding("utf8");

      req.on("data", (chunk) => {
        data += chunk;
      });

      req.on("end", () => {
        logger.info("🔥 Raw webhook data:", data);

        req.rawBody = data;

        try {
          req.body = JSON.parse(data);
        } catch (e) {
          req.body = {}; // Or keep raw if you prefer
        }

        next();
      });
    } else {
      // For all other routes, normal JSON and urlencoded parsing
      json({ limit: "10mb" })(req, res, (err) => {
        if (err) return next(err);
        urlencoded({ extended: true, limit: "10mb" })(req, res, next);
      });
    }
  });

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

  // Set up Swagger
  const config = new DocumentBuilder()
    .setTitle("Paybolt API")
    .setDescription("The Paybolt API description")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  // Set up template engine
  const viewsPath = join(
    process.cwd(),
    "src",
    "modules",
    "payments",
    "templates",
  );
  app.setBaseViewsDir(viewsPath);

  // Configure Handlebars
  app.engine("hbs", hbs.__express);
  app.setViewEngine("hbs");

  // Register Handlebars partials
  hbs.registerHelper("eq", function (v1, v2) {
    return v1 === v2;
  });
  // hbs.registerHelper("json", function (context) {
  //   return JSON.stringify(context, null, 2);
  // });
  hbs.registerPartials(join(viewsPath, "partials"));
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
