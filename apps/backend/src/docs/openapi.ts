function successResponse(
  schemaName: string,
  description = "Successful response",
) {
  return {
    description,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { $ref: `#/components/schemas/${schemaName}` },
          },
          required: ["success", "data"],
        },
      },
    },
  };
}

function paginatedResponse(
  schemaName: string,
  description = "Successful response",
) {
  return {
    description,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "array",
              items: { $ref: `#/components/schemas/${schemaName}` },
            },
            pagination: { $ref: "#/components/schemas/Pagination" },
          },
          required: ["success", "data", "pagination"],
        },
      },
    },
  };
}

function nullResponse(description = "Successful response with no payload") {
  return {
    description,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "null" },
          },
          required: ["success", "data"],
        },
      },
    },
  };
}

function jsonBody(schemaName: string) {
  return {
    required: true,
    content: {
      "application/json": {
        schema: { $ref: `#/components/schemas/${schemaName}` },
      },
    },
  };
}

const publicOrderStatuses = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
] as const;

const allOrderStatuses = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SERVED",
  "COMPLETED",
  "CANCELLED",
] as const;

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Restaurant POS API",
    version: "1.0.0",
    description:
      "REST API for the restaurant POS system: tables, menu, ordering, kitchen queue, payments, order history and daily dashboard. All business endpoints (except the public ones) require a bearer access token and are restricted by role.",
  },
  tags: [
    { name: "Health", description: "Infrastructure health check" },
    { name: "Auth", description: "Authentication and owner bootstrap" },
    { name: "Users", description: "Staff account management" },
    { name: "Categories", description: "Menu categories" },
    { name: "Products", description: "Menu products" },
    { name: "Inventory", description: "Ingredients and product recipes" },
    { name: "Coupons", description: "Discount coupons" },
    { name: "Loyalty", description: "Customer loyalty points" },
    { name: "Notifications", description: "Staff notifications" },
    { name: "Tables", description: "Restaurant tables and QR codes" },
    { name: "Dashboard", description: "Daily business summary" },
    { name: "Analytics", description: "Sales analytics and stock overview" },
    { name: "Orders", description: "Order lifecycle management" },
    { name: "Order Queue", description: "Active kitchen queue" },
    { name: "Order History", description: "Completed order search" },
    { name: "Staff Orders", description: "Order details for staff" },
    { name: "Payments", description: "Order payments and payment history" },
    {
      name: "Public Menu",
      description: "Customer-facing menu by table QR code",
    },
    { name: "Public Orders", description: "Customer order placement" },
  ],
  paths: {
    "/api/v1/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        operationId: "getHealth",
        responses: {
          200: {
            description: "Server is running",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Server is running" },
                  },
                  required: ["success", "message"],
                },
              },
            },
          },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/auth/bootstrap/owner": {
      post: {
        tags: ["Auth"],
        summary: "Bootstrap the owner account",
        description:
          "Creates the first OWNER account. Succeeds only once; any further call returns 409 OWNER_ALREADY_EXISTS.",
        operationId: "bootstrapOwner",
        requestBody: jsonBody("BootstrapOwnerRequest"),
        responses: {
          201: successResponse("SafeUserWithStatus", "Owner account created"),
          400: { $ref: "#/components/responses/ValidationError" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in",
        description:
          "Authenticates with email and password and returns a new access/refresh token pair. Rate limited to 10 attempts per 15 minutes.",
        operationId: "login",
        requestBody: jsonBody("LoginRequest"),
        responses: {
          200: successResponse("LoginResult"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          429: { $ref: "#/components/responses/TooManyRequests" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh tokens",
        description:
          "Exchanges a valid refresh token for a new access/refresh token pair. Rate limited to 30 attempts per 15 minutes.",
        operationId: "refreshTokens",
        requestBody: jsonBody("RefreshTokenRequest"),
        responses: {
          200: successResponse("RefreshResult"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          429: { $ref: "#/components/responses/TooManyRequests" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out",
        description: "Revokes the given refresh token.",
        operationId: "logout",
        requestBody: jsonBody("RefreshTokenRequest"),
        responses: {
          200: nullResponse("Refresh token revoked"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Current user",
        description: "Returns the authenticated user's profile.",
        operationId: "getMe",
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse("SafeUserWithStatus", "The authenticated user"),
          401: { $ref: "#/components/responses/Unauthorized" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/users": {
      post: {
        tags: ["Users"],
        summary: "Create staff user",
        description: "Creates a staff account. Owner role only.",
        operationId: "createUser",
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody("CreateUserRequest"),
        responses: {
          201: successResponse("SafeUserWithStatus", "User created"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      get: {
        tags: ["Users"],
        summary: "List staff users",
        description: "Lists all staff accounts. Owner role only.",
        operationId: "listUsers",
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse("AdminUserList"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/users/{id}": {
      patch: {
        tags: ["Users"],
        summary: "Update staff profile",
        description:
          "Updates a staff member's profile (name, email, role). Owner accounts cannot be modified. Owner role only.",
        operationId: "updateUserProfile",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        requestBody: jsonBody("UpdateUserProfileRequest"),
        responses: {
          200: successResponse("AdminUser", "Profile updated"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Delete staff user",
        description: "Deletes a staff account. Owner role only.",
        operationId: "deleteUser",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        responses: {
          200: nullResponse("User deleted"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/users/{id}/status": {
      patch: {
        tags: ["Users"],
        summary: "Update staff status",
        description:
          "Updates a staff member's status (suspend, activate) following the allowed status transitions. Owner role only.",
        operationId: "updateUserStatus",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        requestBody: jsonBody("UpdateUserStatusRequest"),
        responses: {
          200: successResponse("AdminUser", "Status updated"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/categories": {
      get: {
        tags: ["Categories"],
        summary: "List categories",
        description: "Lists active categories. Accessible to all staff roles.",
        operationId: "listCategories",
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse("CategoryList"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      post: {
        tags: ["Categories"],
        summary: "Create category",
        description: "Creates a category. Owner and manager roles only.",
        operationId: "createCategory",
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody("CreateCategoryRequest"),
        responses: {
          201: successResponse("Category", "Category created"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/categories/{id}": {
      get: {
        tags: ["Categories"],
        summary: "Get category",
        description:
          "Returns a single category. Accessible to all staff roles.",
        operationId: "getCategory",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        responses: {
          200: successResponse("Category"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      patch: {
        tags: ["Categories"],
        summary: "Update category",
        description: "Updates a category. Owner and manager roles only.",
        operationId: "updateCategory",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        requestBody: jsonBody("UpdateCategoryRequest"),
        responses: {
          200: successResponse("Category"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      delete: {
        tags: ["Categories"],
        summary: "Disable category",
        description:
          "Soft-deletes (deactivates) a category. Owner and manager roles only.",
        operationId: "disableCategory",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        responses: {
          200: successResponse("Category", "Disabled category"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/products": {
      get: {
        tags: ["Products"],
        summary: "List products",
        description: "Lists available products. Accessible to all staff roles.",
        operationId: "listProducts",
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse("ProductList"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      post: {
        tags: ["Products"],
        summary: "Create product",
        description: "Creates a product. Owner and manager roles only.",
        operationId: "createProduct",
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody("CreateProductRequest"),
        responses: {
          201: successResponse("Product", "Product created"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get product",
        description: "Returns a single product. Accessible to all staff roles.",
        operationId: "getProduct",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        responses: {
          200: successResponse("Product"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      patch: {
        tags: ["Products"],
        summary: "Update product",
        description: "Updates a product. Owner and manager roles only.",
        operationId: "updateProduct",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        requestBody: jsonBody("UpdateProductRequest"),
        responses: {
          200: successResponse("Product"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      delete: {
        tags: ["Products"],
        summary: "Disable product",
        description: "Soft-deletes a product. Owner and manager roles only.",
        operationId: "disableProduct",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        responses: {
          200: successResponse("Product", "Disabled product"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/ingredients": {
      get: {
        tags: ["Inventory"],
        summary: "List ingredients",
        description: "Lists ingredients. Accessible to all staff roles.",
        operationId: "listIngredients",
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse("IngredientList"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      post: {
        tags: ["Inventory"],
        summary: "Create ingredient",
        description: "Creates an ingredient. Owner and manager roles only.",
        operationId: "createIngredient",
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody("CreateIngredientRequest"),
        responses: {
          201: successResponse("Ingredient", "Ingredient created"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/ingredients/{id}": {
      get: {
        tags: ["Inventory"],
        summary: "Get ingredient",
        description: "Returns a single ingredient. Accessible to all staff roles.",
        operationId: "getIngredient",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        responses: {
          200: successResponse("Ingredient"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      patch: {
        tags: ["Inventory"],
        summary: "Update ingredient",
        description: "Updates an ingredient. Owner and manager roles only.",
        operationId: "updateIngredient",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        requestBody: jsonBody("UpdateIngredientRequest"),
        responses: {
          200: successResponse("Ingredient"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      delete: {
        tags: ["Inventory"],
        summary: "Disable ingredient",
        description:
          "Soft-deletes (deactivates) an ingredient. Owner and manager roles only.",
        operationId: "disableIngredient",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        responses: {
          200: successResponse("Ingredient", "Disabled ingredient"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/products/{id}/recipe": {
      get: {
        tags: ["Inventory"],
        summary: "Get product recipe",
        description:
          "Returns the ingredient recipe attached to a product. Accessible to all staff roles.",
        operationId: "getProductRecipe",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        responses: {
          200: successResponse("RecipeItemList"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      put: {
        tags: ["Inventory"],
        summary: "Set product recipe",
        description:
          "Replaces the ingredient recipe attached to a product. Owner and manager roles only.",
        operationId: "setProductRecipe",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        requestBody: jsonBody("SetRecipeRequest"),
        responses: {
          200: successResponse("RecipeItemList", "Recipe saved"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/ingredients/low-stock": {
      get: {
        tags: ["Inventory"],
        summary: "List low-stock ingredients",
        description:
          "Lists active ingredients at or below their low-stock threshold. Accessible to all staff roles.",
        operationId: "listLowStockIngredients",
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse("IngredientList"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "List my notifications",
        description:
          "Lists the authenticated staff member's notifications, newest first.",
        operationId: "listNotifications",
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse("NotificationList"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/notifications/{id}/read": {
      patch: {
        tags: ["Notifications"],
        summary: "Mark notification as read",
        description: "Marks one of the authenticated user's notifications as read.",
        operationId: "markNotificationRead",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        responses: {
          204: { description: "Notification marked as read" },
          401: { $ref: "#/components/responses/Unauthorized" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/notifications/read-all": {
      patch: {
        tags: ["Notifications"],
        summary: "Mark all notifications as read",
        description:
          "Marks all of the authenticated user's unread notifications as read.",
        operationId: "markAllNotificationsRead",
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: "All notifications marked as read" },
          401: { $ref: "#/components/responses/Unauthorized" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/coupons": {
      get: {
        tags: ["Coupons"],
        summary: "List coupons",
        description: "Lists coupons. Accessible to all staff roles.",
        operationId: "listCoupons",
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse("CouponList"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      post: {
        tags: ["Coupons"],
        summary: "Create coupon",
        description: "Creates a coupon. Owner and manager roles only.",
        operationId: "createCoupon",
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody("CreateCouponRequest"),
        responses: {
          201: successResponse("Coupon", "Coupon created"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/coupons/validate": {
      get: {
        tags: ["Coupons"],
        summary: "Validate coupon",
        description:
          "Validates a coupon code (?code=...) without consuming it. Accessible to all staff roles.",
        operationId: "validateCoupon",
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse("Coupon"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/coupons/{id}": {
      get: {
        tags: ["Coupons"],
        summary: "Get coupon",
        description: "Returns a single coupon. Accessible to all staff roles.",
        operationId: "getCoupon",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        responses: {
          200: successResponse("Coupon"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      patch: {
        tags: ["Coupons"],
        summary: "Update coupon",
        description: "Updates a coupon. Owner and manager roles only.",
        operationId: "updateCoupon",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        requestBody: jsonBody("UpdateCouponRequest"),
        responses: {
          200: successResponse("Coupon"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      delete: {
        tags: ["Coupons"],
        summary: "Disable coupon",
        description:
          "Soft-deletes (deactivates) a coupon. Owner and manager roles only.",
        operationId: "disableCoupon",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        responses: {
          200: successResponse("Coupon", "Disabled coupon"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/loyalty": {
      get: {
        tags: ["Loyalty"],
        summary: "Look up loyalty balance",
        description:
          "Returns a customer's loyalty balance, lifetime points and tier by phone number (?phone=...). Accessible to all staff roles.",
        operationId: "getLoyaltyBalance",
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse("LoyaltyBalance"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/public/loyalty": {
      get: {
        tags: ["Loyalty"],
        summary: "Check my loyalty balance",
        description:
          "Public endpoint for customers to check their loyalty balance by phone number (?phone=...).",
        operationId: "getPublicLoyaltyBalance",
        responses: {
          200: successResponse("LoyaltyBalance"),
          400: { $ref: "#/components/responses/ValidationError" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/payments/webhook": {
      post: {
        tags: ["Payments"],
        summary: "Stripe webhook",
        description:
          "Receives Stripe payment events with signature verification. On payment_intent.succeeded the matching order is marked PAID. No authentication; verified via the Stripe-Signature header.",
        operationId: "stripeWebhook",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                description: "Raw Stripe event payload",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Event received",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    received: { type: "boolean", example: true },
                  },
                  required: ["received"],
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/payments/webhook/paymob": {
      post: {
        tags: ["Payments"],
        summary: "Paymob transaction callback",
        description:
          "Receives Paymob processed-transaction callbacks verified with HMAC_SHA512 (?hmac=...). On success the matching order is marked PAID. No authentication.",
        operationId: "paymobCallback",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                description: "Paymob callback body with an obj node",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Callback received",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    received: { type: "boolean", example: true },
                  },
                  required: ["received"],
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/public/payment-providers": {
      get: {
        tags: ["Payments"],
        summary: "List online payment providers",
        description:
          "Lists the online payment providers currently configured (e.g. stripe, paymob) for the checkout selector.",
        operationId: "listPaymentProviders",
        responses: {
          200: successResponse("PaymentProviderList"),
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/dashboard/top-products": {
      get: {
        tags: ["Analytics"],
        summary: "Top-selling products",
        description:
          "Top products by quantity sold with revenue, excluding cancelled orders. Owner and manager roles only.",
        operationId: "getTopProducts",
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse("TopProductList"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/dashboard/revenue": {
      get: {
        tags: ["Analytics"],
        summary: "Revenue trend",
        description:
          "Revenue buckets by day, week or month with paid order counts. Owner and manager roles only.",
        operationId: "getRevenueTrend",
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse("RevenuePointList"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/dashboard/stock": {
      get: {
        tags: ["Analytics"],
        summary: "Stock overview",
        description:
          "Active ingredient counts with low-stock and out-of-stock details. Owner and manager roles only.",
        operationId: "getStockSummary",
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse("StockSummary"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/tables": {
      get: {
        tags: ["Tables"],
        summary: "List tables",
        description: "Lists all tables. Accessible to all staff roles.",
        operationId: "listTables",
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse("TableList"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      post: {
        tags: ["Tables"],
        summary: "Create table",
        description:
          "Creates a table and generates its QR code. Owner and manager roles only.",
        operationId: "createTable",
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody("CreateTableRequest"),
        responses: {
          201: successResponse("Table", "Table created"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/tables/{id}": {
      get: {
        tags: ["Tables"],
        summary: "Get table",
        description: "Returns a single table. Accessible to all staff roles.",
        operationId: "getTable",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        responses: {
          200: successResponse("Table"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      patch: {
        tags: ["Tables"],
        summary: "Update table",
        description: "Updates a table. Owner and manager roles only.",
        operationId: "updateTable",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        requestBody: jsonBody("UpdateTableRequest"),
        responses: {
          200: successResponse("Table"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      delete: {
        tags: ["Tables"],
        summary: "Disable table",
        description:
          "Soft-disables a table. Fails with 409 if the table has active orders. Owner and manager roles only.",
        operationId: "disableTable",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        responses: {
          200: successResponse("Table", "Disabled table"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/tables/{id}/qr": {
      get: {
        tags: ["Tables"],
        summary: "Get table QR code",
        description:
          "Returns the table's QR code as a PNG image linking to the public menu. Accessible to all staff roles.",
        operationId: "getTableQr",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        responses: {
          200: {
            description: "QR code PNG image",
            content: {
              "image/png": {
                schema: { type: "string", format: "binary" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/tables/{id}/enable": {
      post: {
        tags: ["Tables"],
        summary: "Enable table",
        description:
          "Re-enables a disabled table, making it available again. Owner and manager roles only.",
        operationId: "enableTable",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        responses: {
          200: successResponse("Table", "Enabled table"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Daily dashboard summary",
        description:
          "Returns order counts by status and payment totals for a given day (defaults to today, in the restaurant timezone). Owner and manager roles only.",
        operationId: "getDashboardSummary",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/DateQueryParam" }],
        responses: {
          200: successResponse("DashboardSummary"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/payments/history": {
      get: {
        tags: ["Payments"],
        summary: "List payment history",
        description:
          "Read-only paginated list of paid payments, newest first. Dates are resolved against the restaurant timezone (Africa/Cairo). Owner and manager roles only.",
        operationId: "getPaymentHistory",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/FromDateQueryParam" },
          { $ref: "#/components/parameters/ToDateQueryParam" },
          { $ref: "#/components/parameters/OrderNumberQueryParam" },
          { $ref: "#/components/parameters/PageQueryParam" },
          { $ref: "#/components/parameters/LimitQueryParam" },
        ],
        responses: {
          200: paginatedResponse("PaymentHistoryItem"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/payments/summary": {
      get: {
        tags: ["Payments"],
        summary: "Payment summary",
        description:
          "Read-only totals (sales amount and paid payment count) for the same filters as the payment history list. Owner and manager roles only.",
        operationId: "getPaymentSummary",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/FromDateQueryParam" },
          { $ref: "#/components/parameters/ToDateQueryParam" },
          { $ref: "#/components/parameters/OrderNumberQueryParam" },
        ],
        responses: {
          200: successResponse("PaymentSummary"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/orders": {
      get: {
        tags: ["Orders"],
        summary: "List orders",
        description: "Paginated list of orders. Accessible to all staff roles.",
        operationId: "listOrders",
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/PageQueryParam" },
          { $ref: "#/components/parameters/LimitQueryParam" },
        ],
        responses: {
          200: paginatedResponse("Order"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Get order",
        description: "Returns a single order. Accessible to all staff roles.",
        operationId: "getOrder",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        responses: {
          200: successResponse("Order"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/orders/{id}/status": {
      patch: {
        tags: ["Orders"],
        summary: "Update order status",
        description:
          "Transitions an order to a new status. Allowed transitions depend on the current status and the caller's role: kitchen may confirm/start/finish preparation, waiters may mark served, owner and manager may perform any transition.",
        operationId: "updateOrderStatus",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        requestBody: jsonBody("UpdateOrderStatusRequest"),
        responses: {
          200: successResponse("Order", "Order status updated"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/orders/{id}/complete": {
      post: {
        tags: ["Orders"],
        summary: "Complete order",
        description:
          "Completes a paid order and releases its table. Owner, manager and cashier roles only.",
        operationId: "completeOrder",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        responses: {
          200: successResponse("Order", "Order completed"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/orders/{id}/cancel": {
      patch: {
        tags: ["Orders"],
        summary: "Cancel order",
        description:
          "Cancels an unpaid order that is still in a cancellable status and releases its table if no other active orders exist. Owner and manager roles only.",
        operationId: "cancelOrder",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdPathParam" }],
        requestBody: jsonBody("CancelOrderRequest"),
        responses: {
          200: successResponse("Order", "Order cancelled"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/orders/{orderId}/payment": {
      post: {
        tags: ["Payments"],
        summary: "Pay order",
        description:
          "Registers a payment for an order in READY or SERVED status and marks the order as paid. Owner, manager and cashier roles only.",
        operationId: "payOrder",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/OrderIdPathParam" }],
        requestBody: jsonBody("CreatePaymentRequest"),
        responses: {
          201: successResponse("Payment", "Payment registered"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/orders/queue": {
      get: {
        tags: ["Order Queue"],
        summary: "Active order queue",
        description:
          "Paginated queue of active orders (PENDING, CONFIRMED, PREPARING, READY), optionally filtered by status. Accessible to all staff roles.",
        operationId: "getOrderQueue",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            required: false,
            description: "Filter by an active order status",
            schema: {
              type: "string",
              enum: [...publicOrderStatuses],
            },
          },
          { $ref: "#/components/parameters/PageQueryParam" },
          { $ref: "#/components/parameters/LimitQueryParam" },
        ],
        responses: {
          200: paginatedResponse("Order"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/orders/history": {
      get: {
        tags: ["Order History"],
        summary: "Order history",
        description:
          "Searches past orders by order number, status, and/or date (YYYY-MM-DD), paginated. Owner, manager and cashier roles only.",
        operationId: "getOrderHistory",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "orderNumber",
            in: "query",
            required: false,
            description: "Filter by order number",
            schema: { type: "integer", minimum: 1 },
          },
          {
            name: "status",
            in: "query",
            required: false,
            description: "Filter by order status",
            schema: {
              type: "string",
              enum: [...allOrderStatuses],
            },
          },
          { $ref: "#/components/parameters/DateQueryParam" },
          { $ref: "#/components/parameters/PageQueryParam" },
          { $ref: "#/components/parameters/LimitQueryParam" },
        ],
        responses: {
          200: paginatedResponse("OrderHistoryItem"),
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/staff/orders/{orderId}": {
      get: {
        tags: ["Staff Orders"],
        summary: "Staff order details",
        description:
          "Returns order, table, items and latest payment details for staff screens. Accessible to all staff roles.",
        operationId: "getStaffOrderDetails",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/OrderIdPathParam" }],
        responses: {
          200: successResponse("StaffOrderDetails"),
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/public/tables/{qrCode}/menu": {
      get: {
        tags: ["Public Menu"],
        summary: "Public menu by table QR code",
        description:
          "Returns the active menu with categories and available products for a table, resolved by its QR code. No authentication required.",
        operationId: "getPublicMenu",
        parameters: [{ $ref: "#/components/parameters/QrCodePathParam" }],
        responses: {
          200: successResponse("PublicMenu"),
          400: { $ref: "#/components/responses/ValidationError" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/v1/public/orders": {
      post: {
        tags: ["Public Orders"],
        summary: "Create order",
        description:
          "Places an order for a table. No authentication required. All products must exist and be available, and the table must be enabled.",
        operationId: "createOrder",
        requestBody: jsonBody("CreateOrderRequest"),
        responses: {
          201: successResponse("CreateOrderResult", "Order created"),
          400: { $ref: "#/components/responses/ValidationError" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    parameters: {
      IdPathParam: {
        name: "id",
        in: "path",
        required: true,
        description: "Entity id",
        schema: { type: "string", minLength: 1 },
      },
      OrderIdPathParam: {
        name: "orderId",
        in: "path",
        required: true,
        description: "Order id",
        schema: { type: "string", minLength: 1 },
      },
      QrCodePathParam: {
        name: "qrCode",
        in: "path",
        required: true,
        description:
          "Table QR code (e.g. tbl_...) used to resolve the public menu",
        schema: { type: "string", minLength: 1 },
      },
      PageQueryParam: {
        name: "page",
        in: "query",
        required: false,
        description: "Page number, 1-based",
        schema: { type: "integer", minimum: 1, default: 1 },
      },
      LimitQueryParam: {
        name: "limit",
        in: "query",
        required: false,
        description: "Items per page",
        schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      },
      DateQueryParam: {
        name: "date",
        in: "query",
        required: false,
        description: "Date in YYYY-MM-DD format",
        schema: {
          type: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
        },
      },
      FromDateQueryParam: {
        name: "from",
        in: "query",
        required: false,
        description:
          "Range start date (inclusive, restaurant-local) in YYYY-MM-DD format",
        schema: {
          type: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
        },
      },
      ToDateQueryParam: {
        name: "to",
        in: "query",
        required: false,
        description:
          "Range end date (inclusive, restaurant-local) in YYYY-MM-DD format",
        schema: {
          type: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
        },
      },
      OrderNumberQueryParam: {
        name: "orderNumber",
        in: "query",
        required: false,
        description: "Filter by order number",
        schema: { type: "integer", minimum: 1 },
      },
    },
    responses: {
      ValidationError: {
        description: "Request validation failed",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiError" },
            example: {
              success: false,
              error: {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: [{ field: "email", message: "Invalid email address" }],
              },
            },
          },
        },
      },
      Unauthorized: {
        description: "Missing, invalid or expired access token",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiError" },
            example: {
              success: false,
              error: {
                code: "AUTHENTICATION_REQUIRED",
                message: "No access token provided",
              },
            },
          },
        },
      },
      Forbidden: {
        description: "The authenticated user lacks the required role",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiError" },
            example: {
              success: false,
              error: {
                code: "FORBIDDEN",
                message: "You do not have permission to perform this action",
              },
            },
          },
        },
      },
      NotFound: {
        description: "The requested resource does not exist",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiError" },
            example: {
              success: false,
              error: {
                code: "ORDER_NOT_FOUND",
                message: "Order not found",
              },
            },
          },
        },
      },
      Conflict: {
        description: "The request conflicts with the current state",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiError" },
            example: {
              success: false,
              error: {
                code: "ORDER_INVALID_STATUS",
                message: "Cannot change order status from SERVED to PREPARING",
              },
            },
          },
        },
      },
      TooManyRequests: {
        description: "Rate limit exceeded",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RateLimitError" },
          },
        },
      },
      InternalServerError: {
        description: "Unexpected server error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiError" },
            example: {
              success: false,
              error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An unexpected error occurred",
              },
            },
          },
        },
      },
    },
    schemas: {
      UserRole: {
        type: "string",
        enum: ["OWNER", "MANAGER", "CASHIER", "WAITER", "KITCHEN"],
      },
      UserStatus: {
        type: "string",
        enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      },
      TableStatus: {
        type: "string",
        enum: ["AVAILABLE", "OCCUPIED", "DISABLED"],
      },
      OrderStatus: {
        type: "string",
        enum: [...allOrderStatuses],
      },
      PaymentMethod: {
        type: "string",
        enum: ["CASH", "CARD"],
      },
      PaymentStatus: {
        type: "string",
        enum: ["PENDING", "PAID", "VOIDED"],
      },
      SafeUserWithStatus: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { $ref: "#/components/schemas/UserRole" },
          status: { $ref: "#/components/schemas/UserStatus" },
        },
        required: ["id", "name", "email", "role", "status"],
      },
      AdminUser: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { $ref: "#/components/schemas/UserRole" },
          status: { $ref: "#/components/schemas/UserStatus" },
          lastLoginAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "name",
          "email",
          "role",
          "status",
          "lastLoginAt",
          "createdAt",
          "updatedAt",
        ],
      },
      AdminUserList: {
        type: "array",
        items: { $ref: "#/components/schemas/AdminUser" },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "name",
          "description",
          "isActive",
          "createdAt",
          "updatedAt",
        ],
      },
      CategoryList: {
        type: "array",
        items: { $ref: "#/components/schemas/Category" },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "string" },
          categoryId: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          price: {
            type: "number",
            description: "Unit price in the currency base unit",
          },
          imageUrl: { type: "string", nullable: true },
          isAvailable: { type: "boolean" },
          isDeleted: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "categoryId",
          "name",
          "description",
          "price",
          "imageUrl",
          "isAvailable",
          "isDeleted",
          "createdAt",
          "updatedAt",
        ],
      },
      ProductList: {
        type: "array",
        items: { $ref: "#/components/schemas/Product" },
      },
      Ingredient: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          unit: { type: "string" },
          quantityInStock: { type: "number" },
          lowStockThreshold: { type: "number" },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "name",
          "unit",
          "quantityInStock",
          "lowStockThreshold",
          "isActive",
          "createdAt",
          "updatedAt",
        ],
      },
      IngredientList: {
        type: "array",
        items: { $ref: "#/components/schemas/Ingredient" },
      },
      RecipeItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          productId: { type: "string" },
          ingredientId: { type: "string" },
          quantityUsed: { type: "number" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          ingredient: { $ref: "#/components/schemas/Ingredient" },
        },
        required: [
          "id",
          "productId",
          "ingredientId",
          "quantityUsed",
          "createdAt",
          "updatedAt",
        ],
      },
      RecipeItemList: {
        type: "array",
        items: { $ref: "#/components/schemas/RecipeItem" },
      },
      CouponDiscountType: {
        type: "string",
        enum: ["PERCENT", "FIXED"],
      },
      Coupon: {
        type: "object",
        properties: {
          id: { type: "string" },
          code: { type: "string" },
          discountType: { $ref: "#/components/schemas/CouponDiscountType" },
          value: { type: "number" },
          expiresAt: { type: "string", format: "date-time", nullable: true },
          maxUses: { type: "integer", nullable: true },
          usedCount: { type: "integer" },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "code",
          "discountType",
          "value",
          "usedCount",
          "isActive",
          "createdAt",
          "updatedAt",
        ],
      },
      CouponList: {
        type: "array",
        items: { $ref: "#/components/schemas/Coupon" },
      },
      PaymentProvider: {
        type: "object",
        properties: {
          id: { type: "string", enum: ["stripe", "paymob"] },
          label: { type: "string" },
        },
        required: ["id", "label"],
      },
      PaymentProviderList: {
        type: "array",
        items: { $ref: "#/components/schemas/PaymentProvider" },
      },
      TopProduct: {
        type: "object",
        properties: {
          productId: { type: "string" },
          productName: { type: "string" },
          quantity: { type: "integer" },
          revenue: { type: "number" },
        },
        required: ["productId", "productName", "quantity", "revenue"],
      },
      TopProductList: {
        type: "array",
        items: { $ref: "#/components/schemas/TopProduct" },
      },
      RevenuePoint: {
        type: "object",
        properties: {
          key: { type: "string" },
          amount: { type: "number" },
          orders: { type: "integer" },
        },
        required: ["key", "amount", "orders"],
      },
      RevenuePointList: {
        type: "array",
        items: { $ref: "#/components/schemas/RevenuePoint" },
      },
      StockSummary: {
        type: "object",
        properties: {
          totalActive: { type: "integer" },
          lowCount: { type: "integer" },
          outOfStockCount: { type: "integer" },
          lowStock: {
            type: "array",
            items: { $ref: "#/components/schemas/Ingredient" },
          },
        },
        required: ["totalActive", "lowCount", "outOfStockCount", "lowStock"],
      },
      LoyaltyBalance: {
        type: "object",
        properties: {
          phone: { type: "string" },
          balance: { type: "integer" },
          lifetimePoints: { type: "integer" },
          tier: { type: "string", enum: ["Bronze", "Silver", "Gold"] },
        },
        required: ["phone", "balance", "lifetimePoints", "tier"],
      },
      Notification: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          type: { type: "string" },
          title: { type: "string" },
          message: { type: "string" },
          entityType: { type: "string", nullable: true },
          entityId: { type: "string", nullable: true },
          isRead: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "userId",
          "type",
          "title",
          "message",
          "isRead",
          "createdAt",
        ],
      },
      NotificationList: {
        type: "array",
        items: { $ref: "#/components/schemas/Notification" },
      },
      Table: {
        type: "object",
        properties: {
          id: { type: "string" },
          number: { type: "integer" },
          name: { type: "string" },
          qrCode: { type: "string" },
          status: { $ref: "#/components/schemas/TableStatus" },
          menuUrl: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "number",
          "name",
          "qrCode",
          "status",
          "menuUrl",
          "createdAt",
          "updatedAt",
        ],
      },
      TableList: {
        type: "array",
        items: { $ref: "#/components/schemas/Table" },
      },
      OrderItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          productId: { type: "string" },
          productName: { type: "string" },
          quantity: { type: "integer" },
          unitPrice: { type: "number" },
          totalPrice: { type: "number" },
        },
        required: [
          "id",
          "productId",
          "productName",
          "quantity",
          "unitPrice",
          "totalPrice",
        ],
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "string" },
          orderNumber: { type: "integer" },
          tableId: { type: "string" },
          tableNumber: { type: "integer" },
          status: { $ref: "#/components/schemas/OrderStatus" },
          paymentStatus: { $ref: "#/components/schemas/PaymentStatus" },
          totalAmount: { type: "number" },
          couponCode: { type: "string", nullable: true },
          discountAmount: { type: "number" },
          customerPhone: { type: "string", nullable: true },
          cancelledAt: { type: "string", format: "date-time", nullable: true },
          cancelledReason: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/OrderItem" },
          },
        },
        required: [
          "id",
          "orderNumber",
          "tableId",
          "tableNumber",
          "status",
          "paymentStatus",
          "totalAmount",
          "cancelledAt",
          "cancelledReason",
          "createdAt",
          "updatedAt",
          "items",
        ],
      },
      CreateOrderResult: {
        type: "object",
        properties: {
          id: { type: "string" },
          orderNumber: { type: "integer" },
          tableId: { type: "string" },
          status: { $ref: "#/components/schemas/OrderStatus" },
          totalAmount: { type: "number" },
          couponCode: { type: "string", nullable: true },
          discountAmount: { type: "number" },
          customerPhone: { type: "string", nullable: true },
          stripeClientSecret: { type: "string", nullable: true },
          onlineProvider: { type: "string", nullable: true },
          paymentRedirectUrl: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/OrderItem" },
          },
        },
        required: [
          "id",
          "orderNumber",
          "tableId",
          "status",
          "totalAmount",
          "createdAt",
          "updatedAt",
          "items",
        ],
      },
      Payment: {
        type: "object",
        properties: {
          id: { type: "string" },
          orderId: { type: "string" },
          amount: { type: "number" },
          method: { $ref: "#/components/schemas/PaymentMethod" },
          status: { $ref: "#/components/schemas/PaymentStatus" },
          provider: { type: "string", nullable: true },
          providerRef: { type: "string", nullable: true },
          paidAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "orderId",
          "amount",
          "method",
          "status",
          "paidAt",
          "createdAt",
        ],
      },
      PaymentHistoryItem: {
        type: "object",
        description:
          "Paid payment in the history list. Internal identifiers beyond the payment id are intentionally omitted.",
        properties: {
          id: { type: "string" },
          orderNumber: { type: "integer" },
          tableNumber: { type: "integer" },
          amount: { type: "number" },
          method: { $ref: "#/components/schemas/PaymentMethod" },
          status: { $ref: "#/components/schemas/PaymentStatus" },
          paidAt: { type: "string", format: "date-time", nullable: true },
        },
        required: [
          "id",
          "orderNumber",
          "tableNumber",
          "amount",
          "method",
          "status",
          "paidAt",
        ],
      },
      PaymentSummary: {
        type: "object",
        properties: {
          totalSales: { type: "number" },
          paidCount: { type: "integer" },
        },
        required: ["totalSales", "paidCount"],
      },
      OrderHistoryItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          orderNumber: { type: "integer" },
          table: {
            type: "object",
            properties: {
              number: { type: "integer" },
            },
            required: ["number"],
          },
          status: { $ref: "#/components/schemas/OrderStatus" },
          totalAmount: { type: "number" },
          createdAt: { type: "string", format: "date-time" },
          payment: {
            type: "object",
            properties: {
              status: { $ref: "#/components/schemas/PaymentStatus" },
              method: {
                $ref: "#/components/schemas/PaymentMethod",
                nullable: true,
              },
            },
            required: ["status", "method"],
          },
        },
        required: [
          "id",
          "orderNumber",
          "table",
          "status",
          "totalAmount",
          "createdAt",
          "payment",
        ],
      },
      StaffOrderItem: {
        type: "object",
        properties: {
          product: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
            },
            required: ["id", "name"],
          },
          quantity: { type: "integer" },
          unitPrice: { type: "number" },
          totalPrice: { type: "number" },
        },
        required: ["product", "quantity", "unitPrice", "totalPrice"],
      },
      StaffPayment: {
        type: "object",
        properties: {
          status: { $ref: "#/components/schemas/PaymentStatus" },
          method: { $ref: "#/components/schemas/PaymentMethod" },
          amount: { type: "number" },
          paidAt: { type: "string", format: "date-time", nullable: true },
        },
        required: ["status", "method", "amount", "paidAt"],
      },
      StaffOrderDetails: {
        type: "object",
        properties: {
          order: {
            type: "object",
            properties: {
              id: { type: "string" },
              orderNumber: { type: "integer" },
              status: { $ref: "#/components/schemas/OrderStatus" },
              totalAmount: { type: "number" },
            },
            required: ["id", "orderNumber", "status", "totalAmount"],
          },
          table: {
            type: "object",
            properties: {
              id: { type: "string" },
              number: { type: "integer" },
            },
            required: ["id", "number"],
          },
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/StaffOrderItem" },
          },
          payment: {
            $ref: "#/components/schemas/StaffPayment",
            nullable: true,
          },
        },
        required: ["order", "table", "items", "payment"],
      },
      PublicProduct: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          price: { type: "number" },
          imageUrl: { type: "string", nullable: true },
          isAvailable: { type: "boolean" },
        },
        required: [
          "id",
          "name",
          "description",
          "price",
          "imageUrl",
          "isAvailable",
        ],
      },
      PublicCategory: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          products: {
            type: "array",
            items: { $ref: "#/components/schemas/PublicProduct" },
          },
        },
        required: ["id", "name", "products"],
      },
      PublicMenu: {
        type: "object",
        properties: {
          table: {
            type: "object",
            properties: {
              id: { type: "string" },
              number: { type: "integer" },
            },
            required: ["id", "number"],
          },
          restaurant: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/PublicRestaurant" }],
          },
          categories: {
            type: "array",
            items: { $ref: "#/components/schemas/PublicCategory" },
          },
        },
        required: ["table", "restaurant", "categories"],
      },
      PublicRestaurant: {
        type: "object",
        properties: {
          name: { type: "string" },
          logoUrl: { type: "string", nullable: true },
        },
        required: ["name", "logoUrl"],
      },
      LoginResult: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/SafeUserWithStatus" },
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
        },
        required: ["user", "accessToken", "refreshToken"],
      },
      RefreshResult: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
        },
        required: ["accessToken", "refreshToken"],
      },
      DashboardOrders: {
        type: "object",
        properties: {
          total: { type: "integer" },
          pending: { type: "integer" },
          confirmed: { type: "integer" },
          preparing: { type: "integer" },
          ready: { type: "integer" },
          served: { type: "integer" },
          completed: { type: "integer" },
          cancelled: { type: "integer" },
        },
        required: [
          "total",
          "pending",
          "confirmed",
          "preparing",
          "ready",
          "served",
          "completed",
          "cancelled",
        ],
      },
      DashboardPayments: {
        type: "object",
        properties: {
          paidOrders: { type: "integer" },
          totalSales: { type: "number" },
        },
        required: ["paidOrders", "totalSales"],
      },
      DashboardSummary: {
        type: "object",
        properties: {
          orders: { $ref: "#/components/schemas/DashboardOrders" },
          payments: { $ref: "#/components/schemas/DashboardPayments" },
        },
        required: ["orders", "payments"],
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer" },
          limit: { type: "integer" },
          total: { type: "integer" },
          totalPages: { type: "integer" },
        },
        required: ["page", "limit", "total", "totalPages"],
      },
      ValidationIssue: {
        type: "object",
        properties: {
          field: { type: "string" },
          message: { type: "string" },
        },
        required: ["field", "message"],
      },
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: {
                type: "array",
                items: { $ref: "#/components/schemas/ValidationIssue" },
                description: "Present on validation errors",
              },
            },
            required: ["code", "message"],
          },
        },
        required: ["success", "error"],
      },
      RateLimitError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: {
            type: "string",
            example: "Too many requests, please try again later",
          },
        },
        required: ["success", "message"],
      },
      BootstrapOwnerRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 100 },
          email: { type: "string", format: "email", maxLength: 255 },
          password: {
            type: "string",
            minLength: 8,
            maxLength: 72,
            description:
              "Must contain uppercase, lowercase, a number and a special character",
          },
        },
        required: ["name", "email", "password"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email", maxLength: 255 },
          password: { type: "string", minLength: 1, maxLength: 72 },
        },
        required: ["email", "password"],
      },
      RefreshTokenRequest: {
        type: "object",
        properties: {
          refreshToken: { type: "string", minLength: 1 },
        },
        required: ["refreshToken"],
      },
      CreateUserRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 100 },
          email: { type: "string", format: "email", maxLength: 255 },
          password: {
            type: "string",
            minLength: 8,
            maxLength: 72,
            description:
              "Must contain uppercase, lowercase, a number and a special character",
          },
          role: {
            type: "string",
            enum: ["MANAGER", "CASHIER", "WAITER", "KITCHEN"],
            default: "CASHIER",
          },
        },
        required: ["name", "email", "password"],
      },
      UpdateUserProfileRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 100 },
          email: { type: "string", format: "email", maxLength: 255 },
          role: {
            type: "string",
            enum: ["MANAGER", "CASHIER", "WAITER", "KITCHEN"],
          },
        },
        required: ["name", "email", "role"],
      },
      UpdateUserStatusRequest: {
        type: "object",
        properties: {
          status: { $ref: "#/components/schemas/UserStatus" },
        },
        required: ["status"],
      },
      CreateCategoryRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          description: { type: "string", maxLength: 500, nullable: true },
        },
        required: ["name"],
      },
      UpdateCategoryRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          description: { type: "string", maxLength: 500, nullable: true },
          isActive: { type: "boolean" },
        },
      },
      CreateProductRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          categoryId: { type: "string", minLength: 1 },
          description: { type: "string", maxLength: 500, nullable: true },
          price: { type: "number", exclusiveMinimum: 0 },
          imageUrl: { type: "string", maxLength: 2048, nullable: true },
        },
        required: ["name", "categoryId", "price"],
      },
      UpdateProductRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          categoryId: { type: "string", minLength: 1 },
          description: { type: "string", maxLength: 500, nullable: true },
          price: { type: "number", exclusiveMinimum: 0 },
          imageUrl: { type: "string", maxLength: 2048, nullable: true },
          isAvailable: { type: "boolean" },
        },
      },
      CreateIngredientRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          unit: { type: "string", minLength: 1, maxLength: 20 },
          quantityInStock: { type: "number", minimum: 0 },
          lowStockThreshold: { type: "number", minimum: 0 },
        },
        required: ["name", "unit"],
      },
      UpdateIngredientRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          unit: { type: "string", minLength: 1, maxLength: 20 },
          quantityInStock: { type: "number", minimum: 0 },
          lowStockThreshold: { type: "number", minimum: 0 },
          isActive: { type: "boolean" },
        },
      },
      SetRecipeItemRequest: {
        type: "object",
        properties: {
          ingredientId: { type: "string", minLength: 1 },
          quantityUsed: { type: "number", exclusiveMinimum: 0 },
        },
        required: ["ingredientId", "quantityUsed"],
      },
      SetRecipeRequest: {
        type: "object",
        properties: {
          items: {
            type: "array",
            maxItems: 100,
            items: { $ref: "#/components/schemas/SetRecipeItemRequest" },
          },
        },
        required: ["items"],
      },
      CreateTableRequest: {
        type: "object",
        properties: {
          number: { type: "integer", exclusiveMinimum: 0 },
          name: { type: "string", minLength: 1, maxLength: 100 },
        },
        required: ["number", "name"],
      },
      UpdateTableRequest: {
        type: "object",
        properties: {
          number: { type: "integer", exclusiveMinimum: 0 },
          name: { type: "string", minLength: 1, maxLength: 100 },
        },
      },
      CreateOrderItemRequest: {
        type: "object",
        properties: {
          productId: { type: "string", minLength: 1 },
          quantity: { type: "integer", exclusiveMinimum: 0 },
        },
        required: ["productId", "quantity"],
      },
      CreateOrderRequest: {
        type: "object",
        properties: {
          tableId: { type: "string", minLength: 1 },
          items: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/CreateOrderItemRequest" },
          },
          couponCode: { type: "string", minLength: 1, maxLength: 32 },
          customerPhone: { type: "string", minLength: 7, maxLength: 20 },
          payOnline: { type: "boolean" },
          onlineProvider: { type: "string", enum: ["stripe", "paymob"] },
        },
        required: ["tableId", "items"],
      },
      CreateCouponRequest: {
        type: "object",
        properties: {
          code: { type: "string", minLength: 1, maxLength: 32 },
          discountType: {
            $ref: "#/components/schemas/CouponDiscountType",
          },
          value: { type: "number", exclusiveMinimum: 0 },
          expiresAt: { type: "string", format: "date-time", nullable: true },
          maxUses: { type: "integer", exclusiveMinimum: 0, nullable: true },
        },
        required: ["code", "discountType", "value"],
      },
      UpdateCouponRequest: {
        type: "object",
        properties: {
          code: { type: "string", minLength: 1, maxLength: 32 },
          discountType: {
            $ref: "#/components/schemas/CouponDiscountType",
          },
          value: { type: "number", exclusiveMinimum: 0 },
          expiresAt: { type: "string", format: "date-time", nullable: true },
          maxUses: { type: "integer", exclusiveMinimum: 0, nullable: true },
          isActive: { type: "boolean" },
        },
      },
      UpdateOrderStatusRequest: {
        type: "object",
        properties: {
          status: { $ref: "#/components/schemas/OrderStatus" },
        },
        required: ["status"],
      },
      CancelOrderRequest: {
        type: "object",
        properties: {
          reason: { type: "string", maxLength: 500 },
        },
      },
      CreatePaymentRequest: {
        type: "object",
        properties: {
          method: { $ref: "#/components/schemas/PaymentMethod" },
        },
        required: ["method"],
      },
    },
  },
};
