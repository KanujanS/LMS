import mongoose from "mongoose";

// Connect to mongodb database
const connectDB = async () => {
  try {
    // Connection events
    mongoose.connection.on("connected", () => console.log("Database Connected"));
    mongoose.connection.on("error", (err) => {
      console.error('MongoDB connection error:', err);
    });
    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    // Connect with retry logic
    const connectWithRetry = async (retries = 5) => {
      try {
        await mongoose.connect(process.env.MONGODB_URI, {
          dbName: 'lms',
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
          heartbeatFrequencyMS: 1000 // Heartbeat every second
        });
        console.log('MongoDB connected successfully');
      } catch (err) {
        if (retries > 0) {
          console.log(`MongoDB connection failed. Retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
          return connectWithRetry(retries - 1);
        }
        throw err;
      }
    };

    await connectWithRetry();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    // Don't throw the error, let the application continue
    // but in a degraded state
    return false;
  }
  return true;
};

export default connectDB;
