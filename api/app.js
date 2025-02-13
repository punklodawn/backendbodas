import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rsvpRoutes from "./routes/rsvpRoutes.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'https://nuestrabodalym.netlify.app',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json());
app.use("/api", rsvpRoutes);

export default app;