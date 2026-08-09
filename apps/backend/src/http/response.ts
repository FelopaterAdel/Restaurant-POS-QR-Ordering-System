import type { Response } from "express";

export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function successResponse<T>(data: T, statusCode = 200) {
  return { success: true as const, data };
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  res.status(statusCode).json(successResponse(data));
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationDTO,
  statusCode = 200,
) {
  res.status(statusCode).json({
    success: true,
    data,
    pagination,
  });
}
