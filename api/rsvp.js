import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());
// app.use(cors());
const port = 3000;

// Permitir solicitudes desde tu frontend
app.use(cors({
  origin: [
    'https://nuestrabodalym.netlify.app', // Producción
    'http://localhost:5173'              // Desarrollo (Vite)
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],   // Especifica tu dominio de frontend
}));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.post("/api/rsvp", async (req, res) => {
  const { nombre, email, asistencia, adultos, ninos } = req.body;
  console.log(req.body);

  
  if (!nombre || !email || asistencia === undefined) {
    console.log(req.body);
    return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
  }

    // 🔹 1️⃣ Verificar si el email ya existe en la BD
    const { data: existingUser, error: fetchError } = await supabase
    .from("invitados")
    .select("email")
    .eq("email", email)
    .single(); // Solo queremos un resultado

  if (fetchError) {
    return res.status(500).json({ mensaje: "Error al verificar el email", error: fetchError });
  }

  if (existingUser) {
    return res.status(400).json({ mensaje: "Ya existe una invitación registrada con este email" });
  }
  
  const { data, error } = await supabase
  .from("invitados")
  .insert([{ nombre, email, asistencia, adultos, ninos }]);
  
  if (error) return res.status(500).json({ mensaje: "Error al guardar en la BD", error });
  
  res.status(200).json({ mensaje: "Confirmación registrada correctamente" });
});

app.get('/api/rsvp', async (req, res) => {
  const { data, error } = await supabase.from("invitados").select("*");

  if (error) {
    return res.status(500).json({ mensaje: "Error al obtener datos", error });
  }

  res.status(200).json(data);
  });
  

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
export default app;