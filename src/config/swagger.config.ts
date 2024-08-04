import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export const loadSwaggerConfigs = (app: INestApplication) => {
  const options = new DocumentBuilder()
    .setTitle("PayBolt PG")
    .setDescription("A Payment Gateway build by PayBolt")
    .setVersion("1.0.0")
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup("docs", app, document);
};
