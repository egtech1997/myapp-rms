import "dotenv/config";
import connectDB from "./config/db.js";
import { seedRubrics } from "./config/seedRubrics.js";
import app from "./app.js";

connectDB()
  .then(async () => {
    await seedRubrics();
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 API Live at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("💥 Critical Failure:", err.message);
    process.exit(1);
  });
