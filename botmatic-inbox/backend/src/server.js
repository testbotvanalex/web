import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const port = Number(process.env.PORT || 4100);

app.listen(port, () => {
  console.log(`BotMatic Inbox backend listening on http://localhost:${port}`);
});
