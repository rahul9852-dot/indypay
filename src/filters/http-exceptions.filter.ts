import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { errorMessages } from "constants/messages";

@Catch()
export class HttpExceptionsFilter extends BaseExceptionFilter {
  catch(exception: Error | HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      const responseBody = {
        statusCode: status,
        timestamp: new Date(),
        message: exception.getResponse(),
      };

      if ([HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST].includes(status)) {
        return response.status(status).json(responseBody.message);
      }

      return response.status(status).json({
        ...responseBody,
        message: exception.message || errorMessages.internalServerError,
      });
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date(),
      message: exception.message || errorMessages.internalServerError,
    });
  }
}
