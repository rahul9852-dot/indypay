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
      `AxiosService error - Status: ${error?.response?.status}, Data: ${LoggerPlaceHolder.Json}`,
      error?.response?.data,
    );

    const status: number =
      error?.response?.status || error?.response?.data?.status || 500;

    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Something went wrong";

    // Preserve original error data for debugging
    const enhancedError: any =
      status === 401
        ? new UnauthorizedException(message)
        : status !== 500
          ? new BadRequestException(message)
          : new Error(message);

    // Attach original response data to error for debugging
    if (error?.response) {
      enhancedError.response = error.response;
    }
    if (error?.request) {
      enhancedError.request = error.request;
    }

    throw enhancedError;
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

  // async postFormData<T>(
  //   url: string,
  //   data: Record<string, any>,
  //   config?: AxiosRequestConfig,
  // ): Promise<T> {
  //   try {
  //     this.logger.debug(`postFormData - url: ${this.baseUrl}/${url}`);

  //     // Convert object to URLSearchParams for form data
  //     const formData = new URLSearchParams();
  //     Object.entries(data).forEach(([key, value]) => {
  //       formData.append(key, value.toString());
  //     });

  //     const res = await this.axiosInstance.post<T>(url, formData, {
  //       headers: {
  //         "Content-Type": "application/x-www-form-urlencoded",
  //       },
  //       ...config,
  //     });

  //     return res.data;
  //   } catch (error: any) {
  //     this.errorFormatter(error);
  //   }
  // }
}
