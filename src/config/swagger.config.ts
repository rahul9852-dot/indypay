import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export const loadSwaggerConfigs = (app: INestApplication) => {
  const options = new DocumentBuilder()
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "atk",
      },
      "Access Token",
    )
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "rtk",
      },
      "Refresh Token",
    )
    .setTitle("PayBolt PG")
    .setDescription("A Payment Gateway build by PayBolt")
    .setVersion("1.0.0")
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup("docs", app, document);
};
