import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { ERROR_MESSAGES } from "@/constants/messages.constant";

@Catch()
export class HttpExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(HttpExceptionsFilter.name);

  catch(exception: Error | HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!(exception instanceof HttpException)) {
      // Log unhandled errors with full stack so they're visible in the terminal
      this.logger.error(
        `[${request.method} ${request.url}] Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    }

    if (exception instanceof HttpException) {
      const responseBody = {
        statusCode: status,
        success: false,
        timestamp: new Date(),
        message: exception.getResponse(),
      };

      if ([HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST].includes(status)) {
        return response.status(status).json(responseBody.message);
      }

      return response.status(status).json({
        ...responseBody,
        message: exception.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }

    return response.status(status).json({
      statusCode: status,
      success: false,
      message: exception.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }
}
