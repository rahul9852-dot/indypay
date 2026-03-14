const { kill } = require("process");

module.exports = {
  apps: [
    {
      name: "rupeeflow-api",
      script: "./dist/src/main.js",
      instances: 4, // Matches your 8-core CPU
      exec_mode: "cluster",
      max_memory_restart: "1200M", // Restart if process exceeds 1200MB
      env: {
        NODE_ENV: "production",
        TZ: "Asia/Calcutta",
      },
      kill_timeout: 5000, // Wait 5 seconds before forcefully killing the process
      wait_ready: true, // Wait for the process to signal that it's ready before considering it started
      listen_timeout: 10000, // Time to wait for the process to start listening before considering it failed

      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "DD-MM-YYYY HH:mm:ss A",
      watch: false, // Disable watching in production
      // Advanced load distribution settings
      instance_var: "INSTANCE_ID",
      min_uptime: "60s",
      max_restarts: 10,
      restart_delay: 4000,

      // Log rotation settings
      merge_logs: true,
      log_file: "./logs/combined.log",
      log_rotate_interval: "0 0 * * 0", // Run at midnight every Sunday (cron format)
      log_max_size: "50M", // Size threshold for rotation
      log_retain_count: 5, // Only keep 5 rotated log file (effectively deleting logs older than 5 week)
    },
  ],
};
