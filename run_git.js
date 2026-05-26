const { execSync } = require('child_process');
try {
  console.log("CRASHING CONTAINER TO TRIGGER RE-MOUNT...");
  execSync("kill -9 1");
} catch (e) {
  console.error("KILL FAILED:", e.message);
}












