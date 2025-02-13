import  { validationResult } from "express-validator";
import  { verificarEmailExistente, registrarRSVP, obtenerInvitados } from "../services/rsvpService.js";

// 📌 Registrar asistencia (RSVP)
export const postRSVP = async (req, res) => {
  try {
    // Validación de los datos enviados
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const { nombre, email, asistencia, adultos, ninos } = req.body;

    // Verificar si el email ya está registrado
    const existingUser = await verificarEmailExistente(email);
    if (existingUser) {
      return res.status(400).json({ mensaje: "Ya existe una invitación con este email" });
    }

    // Registrar el nuevo RSVP
    const newRSVP = await registrarRSVP({ nombre, email, asistencia, adultos, ninos });
    res.status(201).json({ mensaje: "Confirmación registrada correctamente", data: newRSVP });

  } catch (error) {
    // Manejo de errores
    console.error("Error en el servidor:", error.message);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 📌 Obtener lista de invitados
export const getRSVPs = async (_req, res) => {
  try {
    // Obtener todos los invitados
    const invitados = await obtenerInvitados();
    res.status(200).json(invitados);
  } catch (error) {
    // Manejo de errores
    console.error("Error en el servidor:", error.message);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};
