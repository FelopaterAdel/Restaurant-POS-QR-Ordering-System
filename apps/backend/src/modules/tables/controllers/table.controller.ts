import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import {
  CreateTableUseCase,
  TableNumberAlreadyExistsError,
} from "../use-cases/create-table.use-case.js";
import { DisableTableUseCase } from "../use-cases/disable-table.use-case.js";
import {
  GetTableUseCase,
  TableNotFoundError,
} from "../use-cases/get-table.use-case.js";
import { ListTablesUseCase } from "../use-cases/list-tables.use-case.js";
import { UpdateTableUseCase } from "../use-cases/update-table.use-case.js";

const createTableUseCase = new CreateTableUseCase();
const listTablesUseCase = new ListTablesUseCase();
const getTableUseCase = new GetTableUseCase();
const updateTableUseCase = new UpdateTableUseCase();
const disableTableUseCase = new DisableTableUseCase();

export async function createTable(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const table = await createTableUseCase.execute(req.body);

    res.status(201).json({
      success: true,
      message: "Table created successfully",
      data: table,
    });
  } catch (error) {
    if (error instanceof TableNumberAlreadyExistsError) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function listTables(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const tables = await listTablesUseCase.execute();

    res.status(200).json({
      success: true,
      message: "Tables retrieved successfully",
      data: tables,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTable(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const table = await getTableUseCase.execute(req.params.id);

    res.status(200).json({
      success: true,
      message: "Table retrieved successfully",
      data: table,
    });
  } catch (error) {
    if (error instanceof TableNotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function updateTable(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const table = await updateTableUseCase.execute(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Table updated successfully",
      data: table,
    });
  } catch (error) {
    if (error instanceof TableNotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error instanceof TableNumberAlreadyExistsError) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function disableTable(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const table = await disableTableUseCase.execute(req.params.id);

    res.status(200).json({
      success: true,
      message: "Table disabled successfully",
      data: table,
    });
  } catch (error) {
    if (error instanceof TableNotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
}
