import { resetAdminPassword } from "./reset-admin-password";

console.log("Starting admin password reset...");
resetAdminPassword()
  .then(() => {
    console.log("Admin password reset completed successfully");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error resetting admin password:", error);
    process.exit(1);
  });