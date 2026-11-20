import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { authenticateToken } from "../../middlewares/auth.middleware.js";
import { registerSchema, loginSchema, changePasswordSchema } from "./auth.schemas.js";

const router = Router();

router.post("/register", validateRequest({ body: registerSchema }), AuthController.register);
router.post("/login", validateRequest({ body: loginSchema }), AuthController.login);
router.get("/profile", authenticateToken, AuthController.getProfile);
router.put(
  "/change-password",
  authenticateToken,
  validateRequest({ body: changePasswordSchema }),
  AuthController.changePassword
);

export default router;
