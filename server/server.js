import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express';
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";

const app = express();
const port = 3000;

await connectDB();

// Middleware
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

// ✅ ADD THIS DEBUG ROUTE HERE — BEFORE /api/inngest
app.get("/__env_check", (req, res) => {
  res.json({ INNGEST_SIGNING_KEY_present: !!process.env.INNGEST_SIGNING_KEY });
});

// Root route
app.get('/', (req, res) => res.send('Server is Live!'));

// Inngest route
app.use("/api/inngest", serve({ client: inngest, functions }));

app.listen(port, () =>
  console.log(`Server listening at http://localhost:${port}`)
);
