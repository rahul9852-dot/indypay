import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { COOKIE_KEYS } from "@/enums";

export const loadSwaggerConfigs = (app: INestApplication) => {
  const options = new DocumentBuilder()
    .setTitle("PayBolt PG")
    .setDescription("A Payment Gateway build by PayBolt")
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      COOKIE_KEYS.ACCESS_TOKEN,
    )
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup("docs", app, document);
};
