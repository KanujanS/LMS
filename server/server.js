import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/mongodb.js";
import { stripeWebhooks } from "./controllers/webhooks.js";
import educatorRouter from "./routes/educatorRoutes.js";
import connectCloudinary from "./configs/cloudinary.js";
import courseRouter from "./routes/courseRoute.js";
import userRouter from "./routes/userRoutes.js";

// Initialize Express
const app = express();

// Connect to database
await connectDB();
await connectCloudinary();

// Middlewares
app.use(cors());

// Parse raw body for Stripe webhook route
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));

// Parse JSON for other routes
app.use(express.json());

// Routes
app.get("/", (req, res) => res.send("API Working"));
app.use("/api/user", userRouter);
app.use("/api/educator", educatorRouter);
app.use("/api/course", courseRouter);

// Stripe webhook route
app.post("/api/webhook/stripe", stripeWebhooks);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Port
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
