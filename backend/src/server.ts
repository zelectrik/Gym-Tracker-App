import dotenv from "dotenv";

dotenv.config();
import { app } from "./app";

const port = process.env.PORT ?? 3000;
app.listen(port, () => console.log(`Gym tracker API running on port ${port}`));
