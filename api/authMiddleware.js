// authMiddleware.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Falta la URL o la clave de Supabase. Verifica tus variables de entorno.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const checkAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extraer el token del encabezado

  if (!token) {
    return res.status(401).json({ mensaje: "Acceso no autorizado" });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ mensaje: "Token inválido o expirado" });
    }

    // Verificar si el usuario es admin (asumiendo que el rol está almacenado en los metadatos del usuario)
    const role = user?.user_metadata?.role || 'invitado';
    if (role !== 'admin') {
      return res.status(403).json({ mensaje: "No tienes permisos para acceder a este recurso" });
    }

    req.user = user; // Adjuntar el usuario a la solicitud
    next(); // Continuar si el usuario está autenticado y es admin
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al verificar el token", error });
  }
};