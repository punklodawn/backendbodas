// Importar cliente de Supabase
import supabase from "../config/supabaseClient.js";

// Función para verificar si un email ya está registrado
 export const verificarEmailExistente = async (email) => {
  const { data, error } = await supabase
    .from("invitados")
    .select("email")
    .eq("email", email)
    .single();

  if (error) {
    console.error("Error al verificar el email:", error.message);
    throw new Error("Error al verificar el email");
  }

  return data;
};

// Función para registrar un nuevo RSVP
export const registrarRSVP = async (datos) => {
  const { data, error } = await supabase.from("invitados").insert([datos]);

  if (error) {
    console.error("Error al guardar en la BD:", error.message);
    throw new Error("Error al guardar en la BD");
  }

  return data;
};

// Función para obtener todos los invitados
export const obtenerInvitados = async () => {
  const { data, error } = await supabase.from("invitados").select("*");

  if (error) {
    console.error("Error al obtener los datos:", error.message);
    throw new Error("Error al obtener los datos");
  }

  return data;
};
