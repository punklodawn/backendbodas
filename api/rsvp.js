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


// 🔹 Middleware para verificar el token de autenticación
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Obtener token del header

  if (!token) {
    return res.status(401).json({ mensaje: "Acceso no autorizado. Falta token." });
  }

  // Verificar token con Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ mensaje: "Token inválido o expirado.", error });
  }

  req.user = user; // Agregar usuario autenticado al request
  next();
};

// 🔹 Ruta para verificar sesión activa (el frontend la usará)
app.get('/api/auth/validate', authenticate, (req, res) => {
  res.status(200).json({ mensaje: "Usuario autenticado", user: req.user });
});



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

app.get('/api/rsvp', authenticate, async (req, res) => {
  const { data, error } = await supabase.from("invitados").select("*");

  if (error) {
    return res.status(500).json({ mensaje: "Error al obtener datos", error });
  }

  res.status(200).json(data);
  });

  // Ruta para agregar un comentario
app.post("/api/comentarios", async (req, res) => {
  const { nombre, comentario } = req.body;

  // Validar los datos
  if (!nombre || !comentario) {
    return res.status(400).json({ mensaje: "Nombre y comentario son obligatorios" });
  }

  try {
    // Insertar el comentario en la base de datos y devolver el registro insertado
    const { data, error } = await supabase
      .from("comentarios")
      .insert([{ nombre, comentario }])
      .select(); // Devuelve el registro insertado

    if (error) {
      throw error;
    }

    // Devuelve el comentario recién insertado
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al agregar el comentario", error });
  }
});

// Ruta para obtener todos los comentarios
app.get("/api/comentarios", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("comentarios")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json(data|| []);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los comentarios", error });
  }
});
  

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
export default app;