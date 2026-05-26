const fs = require('fs');

console.log("Checking /root/.bashrc...");
try {
  console.log(fs.readFileSync('/root/.bashrc', 'utf8'));
} catch (e) {
  console.error("Failed /root/.bashrc:", e.message);
}

console.log("Checking /root/.profile...");
try {
  console.log(fs.readFileSync('/root/.profile', 'utf8'));
} catch (e) {
  console.error("Failed /root/.profile:", e.message);
}
