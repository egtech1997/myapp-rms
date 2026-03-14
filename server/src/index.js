import "dotenv/config";
import connectDB from "./config/db.js";
import { seedRubrics } from "./config/seedRubrics.js";
import { seedSystem } from "./config/seedSystem.js";
import app from "./app.js";

connectDB()
  .then(async () => {
    await seedSystem();
    await seedRubrics();
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 API Server running on port ${PORT}`);
      if (process.env.BACKEND_URL) console.log(`🔗 Backend URL: ${process.env.BACKEND_URL}`);
    });
  })
  .catch((err) => {
    console.error("💥 Critical Failure:", err.message);
    process.exit(1);
  });
