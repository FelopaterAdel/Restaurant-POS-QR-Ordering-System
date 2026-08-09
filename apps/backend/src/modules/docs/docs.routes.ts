import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openapiSpec } from "../../docs/openapi.js";

const router = Router();

router.get("/openapi.json", (_req, res) => {
  res.json(openapiSpec);
});

router.get("/", swaggerUi.setup(openapiSpec));
router.use("/", swaggerUi.serve);

export default router;
