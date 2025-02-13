import express from "express";
import { check } from "express-validator";
import { postRSVP, getRSVPs } from "../controllers/rsvpController.js";

const router = express.Router();

// 📌 Middleware de validación
const validateRSVP = [
  check("nombre").notEmpty().withMessage("El nombre es obligatorio"),
  check("email").isEmail().withMessage("Email inválido"),
  check("asistencia").isBoolean().withMessage("Asistencia debe ser true/false"),
  check("adultos").optional().isInt({ min: 0 }).withMessage("Adultos debe ser un número"),
  check("ninos").optional().isInt({ min: 0 }).withMessage("Niños debe ser un número")
];

router.post("/rsvp", validateRSVP, postRSVP);
router.get("/rsvp", getRSVPs);

export default router;