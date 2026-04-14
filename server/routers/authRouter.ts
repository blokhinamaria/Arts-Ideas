import express from 'express'
import { login, getMe, logout } from "../controllers/authController.js";

export const authRouter = express.Router()

authRouter.get("/me", getMe);
authRouter.post("/login", login);
authRouter.post("/logout", logout);