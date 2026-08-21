import { describe, expect, it, vi } from "vitest";
import {
  createTable,
  disableTable,
  enableTable,
  getTable,
  listTables,
  updateTable,
} from "./tables.api";
import type { Table } from "./tables.types";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "@/lib/api";

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPatch = vi.mocked(api.patch);
const mockDelete = vi.mocked(api.delete);

const mockTable: Table = {
  id: "tbl_1",
  number: 5,
  name: "Table 5",
  qrCode: "tbl_abc123",
  status: "AVAILABLE",
  menuUrl: "http://localhost:3000/menu/table/tbl_abc123",
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
};

describe("tables.api", () => {
  describe("listTables", () => {
    it("calls GET /tables", async () => {
      mockGet.mockResolvedValueOnce([mockTable]);

      const result = await listTables();

      expect(mockGet).toHaveBeenCalledWith("/tables");
      expect(result).toEqual([mockTable]);
    });
  });

  describe("getTable", () => {
    it("calls GET /tables/:id", async () => {
      mockGet.mockResolvedValueOnce(mockTable);

      const result = await getTable("tbl_1");

      expect(mockGet).toHaveBeenCalledWith("/tables/tbl_1");
      expect(result).toEqual(mockTable);
    });
  });

  describe("createTable", () => {
    it("calls POST /tables with number and name", async () => {
      mockPost.mockResolvedValueOnce(mockTable);

      const result = await createTable({ number: 5, name: "Table 5" });

      expect(mockPost).toHaveBeenCalledWith("/tables", { number: 5, name: "Table 5" });
      expect(result).toEqual(mockTable);
    });
  });

  describe("updateTable", () => {
    it("calls PATCH /tables/:id with partial data", async () => {
      const updated = { ...mockTable, name: "VIP Table" };
      mockPatch.mockResolvedValueOnce(updated);

      const result = await updateTable("tbl_1", { name: "VIP Table" });

      expect(mockPatch).toHaveBeenCalledWith("/tables/tbl_1", { name: "VIP Table" });
      expect(result.name).toBe("VIP Table");
    });
  });

  describe("disableTable", () => {
    it("calls DELETE /tables/:id", async () => {
      const disabled = { ...mockTable, status: "DISABLED" as const };
      mockDelete.mockResolvedValueOnce(disabled);

      const result = await disableTable("tbl_1");

      expect(mockDelete).toHaveBeenCalledWith("/tables/tbl_1");
      expect(result.status).toBe("DISABLED");
    });
  });

  describe("enableTable", () => {
    it("calls POST /tables/:id/enable", async () => {
      const enabled = { ...mockTable, status: "AVAILABLE" as const };
      mockPost.mockResolvedValueOnce(enabled);

      const result = await enableTable("tbl_1");

      expect(mockPost).toHaveBeenCalledWith("/tables/tbl_1/enable");
      expect(result.status).toBe("AVAILABLE");
    });
  });
});
