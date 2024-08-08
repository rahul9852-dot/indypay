import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import axios, { AxiosRequestConfig, CreateAxiosDefaults } from "axios";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";

export class AxiosService {
  logger = new CustomLogger(AxiosService.name);

  constructor(
    private readonly baseUrl: string,
    private readonly axiosConfig: CreateAxiosDefaults = {},
  ) {}

  axiosInstance = axios.create({
    baseURL: this.baseUrl,
    ...this.axiosConfig,
  });

  errorFormatter = (error: any) => {
    this.logger.error(
      `error: ${LoggerPlaceHolder.Json}`,
      error?.response?.data,
    );

    const status: number = error?.response?.status || 500;

    const message = error?.response?.data?.error || "Something went wrong";

    if (status === 401) {
      throw new UnauthorizedException(message);
    }

    if (status !== 500) {
      throw new BadRequestException(message);
    }

    throw new Error(message);
  };

  async getRequest<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      this.logger.debug(`getRequest - url: ${this.baseUrl}/${url}`);

      const res = await this.axiosInstance.get<T>(url, config);

      return res.data;
    } catch (error: any) {
      this.errorFormatter(error);
    }
  }

  async postRequest<T>(
    url: string,
    data: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      this.logger.debug(`postRequest - url: ${this.baseUrl}/${url}`);

      const res = await this.axiosInstance.post<T>(url, data, config);

      return res.data;
    } catch (error: any) {
      this.errorFormatter(error);
    }
  }

  async putRequest<T>(
    url: string,
    data: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      this.logger.debug(`putRequest - url: ${this.baseUrl}/${url}`);

      const res = await this.axiosInstance.put<T>(url, data, config);

      return res.data;
    } catch (error: any) {
      this.errorFormatter(error);
    }
  }

  async deleteRequest<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      this.logger.debug(`deleteRequest - url: ${this.baseUrl}/${url}`);

      const res = await this.axiosInstance.delete<T>(url, config);

      return res.data;
    } catch (error: any) {
      this.errorFormatter(error);
    }
  }

  async patchRequest<T>(
    url: string,
    data: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      this.logger.debug(`patchRequest - url: ${this.baseUrl}/${url}`);

      const res = await this.axiosInstance.patch<T>(url, data, config);

      return res.data;
    } catch (error: any) {
      this.errorFormatter(error);
    }
  }
}
