import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { CreateTableUseCase } from "../use-cases/create-table.use-case.js";
import { DisableTableUseCase } from "../use-cases/disable-table.use-case.js";
import { EnableTableUseCase } from "../use-cases/enable-table.use-case.js";
import { GetTableUseCase } from "../use-cases/get-table.use-case.js";
import { GetTableQrUseCase } from "../use-cases/get-table-qr.use-case.js";
import { ListTablesUseCase } from "../use-cases/list-tables.use-case.js";
import { UpdateTableUseCase } from "../use-cases/update-table.use-case.js";
import { toTableDto } from "../utils/table.mapper.js";

const createTableUseCase = new CreateTableUseCase();
const listTablesUseCase = new ListTablesUseCase();
const getTableUseCase = new GetTableUseCase();
const getTableQrUseCase = new GetTableQrUseCase();
const updateTableUseCase = new UpdateTableUseCase();
const disableTableUseCase = new DisableTableUseCase();
const enableTableUseCase = new EnableTableUseCase();

export async function createTable(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const table = await createTableUseCase.execute(req.body);
  sendSuccess(res, toTableDto(table), 201);
}

export async function listTables(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const tables = await listTablesUseCase.execute();
  sendSuccess(res, tables.map(toTableDto));
}

export async function getTable(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const table = await getTableUseCase.execute(req.params.id);
  sendSuccess(res, toTableDto(table));
}

export async function getTableQr(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const png = await getTableQrUseCase.execute(req.params.id);

  res.setHeader("Content-Type", "image/png");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="table-${req.params.id}-qr.png"`,
  );
  res.status(200).send(png);
}

export async function updateTable(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const table = await updateTableUseCase.execute(req.params.id, req.body);
  sendSuccess(res, toTableDto(table));
}

export async function disableTable(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const table = await disableTableUseCase.execute(req.params.id);
  sendSuccess(res, toTableDto(table));
}

export async function enableTable(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const table = await enableTableUseCase.execute(req.params.id);
  sendSuccess(res, toTableDto(table));
}
