const cron = require("node-cron");
const userService = require("../services/user.service");

// Cron job funksiyasi
const startCronJobs = () => {
  // Har kuni soat 23:59 da ishga tushadi
  cron.schedule("59 23 * * *", async () => {
    console.log("⏰ Cron job ishladi: Loglarni yopayapti...");
    try {
      const result = await userService.closeLog();
      console.log("Natija:", result);
    } catch (err) {
      console.error("Cron job xatosi:", err.message);
    }
  }, {
    timezone: "Asia/Tashkent", // vaqt zonasi
  });
};

module.exports = startCronJobs;
