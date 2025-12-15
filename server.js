import { serverSecret } from "./src/config/env.config.js";
import app from "./src/app.js";
import { checkConnection } from "./src/config/database.config.js";


(async() => {
  try {
    await checkConnection();
    app.listen(serverSecret.PORT, () => {
      console.log(`Server is running on port ${serverSecret.SERVER_URL}`);
    })
  } catch (error) {
    console.log(error)
  }  
})()