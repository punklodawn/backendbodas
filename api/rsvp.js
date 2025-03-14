import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import NodeCache from "node-cache";
import { checkAuth } from './authMiddleware.js';


dotenv.config();
const app = express();
app.use(express.json());
// app.use(cors());
const port = 3000;

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Permitir solicitudes desde tu frontend
app.use(cors({
  origin: [
    'https://nuestrabodalym.netlify.app', // Producción
    'http://localhost:5173'              // Desarrollo (Vite)
  ],
  methods: ["GET", "POST", "PUT", "DELETE"], // Métodos permitidos
  allowedHeaders: ["Content-Type", "Authorization"], // Encabezados permitidos
  credentials: true, // Permitir credenciales (si es necesario)
}));

const supabase = createClient(
"https://llilswxrkaroyatuhokc.supabase.co",
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsaWxzd3hya2Fyb3lhdHVob2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5NzcwNDQsImV4cCI6MjA1NDU1MzA0NH0.1yaJySmAljR7TGzghHbCyPUDtkyoQEeH54SZVJYmFL8"
);


app.options("*", cors());


app.post("/api/rsvp", async (req, res) => {
  const { nombre, email, asistencia, adultos, ninos } = req.body;


  
  if (!nombre || !email || asistencia === undefined) {

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

  const cacheKey = "rsvp_data";

  if (cache.has(cacheKey)) {
    console.log("Datos obtenidos de caché");
    return res.status(200).json(cache.get(cacheKey));
  }

  try {
    const { data, error } = await supabase.from("invitados").select("*");

    if (error) {
      return res.status(500).json({ mensaje: "Error al obtener datos", error });
    }

    cache.set(cacheKey, data);
    console.log("Datos obtenidos de Supabase y guardados en caché");
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener datos", error });
  }
});

  // Ruta para agregar un comentario
app.post("/api/comentarios", async (req, res) => {
  const { nombre, comentario } = req.body;

  // Validar los datos
  if (!nombre || !comentario) {
    return res.status(400).json({ mensaje: "Nombre y comentario son obligatorios" });
  }

  try {
    // Obtener la fecha y hora actual en UTC
    const fechaUTC = new Date();

    // Convertir la fecha UTC a la zona horaria de Argentina
    const fechaArgentina = new Date(fechaUTC.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));

    // Insertar el comentario en la base de datos con estado "no aprobado"
    const { data, error } = await supabase
      .from("comentarios")
      .insert([{ nombre, comentario, aprobado: false , created_at: fechaArgentina }])
      .select(); // Devuelve el registro insertado

    if (error) {
      throw error;
    }

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
      return res.status(500).json({ mensaje: "Error al obtener los comentarios", error });
    }

    res.status(200).json(data || []);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los comentarios", error });
  }
});
// POST /api/comentarios/:id/like
app.post('/api/comentarios/:id/like', async (req, res) => {
  const { id } = req.params; // ID del comentario

  try {
    // Incrementar el contador de likes en la base de datos
    const { data, error } = await supabase
      .from('comentarios')
      .update({ likes: supabase.raw('likes + 1') }) // Incrementa el campo likes
      .eq('id', id)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({ message: 'Like agregado correctamente.', data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al procesar el like.' });
  }
});

app.get('/api/admin/comentarios', checkAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("comentarios")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json(data || []);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los comentarios", error });
  }
});
  
app.put("/api/admin/comentarios/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  const { aprobado } = req.body;


  try {
    const { data, error } = await supabase
      .from("comentarios")
      .update({ aprobado })
      .eq("id", id)
      .select();

    if (error) {
      throw error;
    }

    res.status(200).json(data[0]);
  } catch (error) {
    console.error("Error al actualizar el comentario:", error);
    res.status(500).json({ mensaje: "Error al actualizar el comentario", error });
  }
});


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
export default app;