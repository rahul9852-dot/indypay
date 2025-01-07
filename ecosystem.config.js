module.exports = {
  apps: [
    {
      name: "dashboard-api",
      script: "./dist/src/main.js",
      instances: "max", // Matches your 8-core CPU
      exec_mode: "cluster",
      max_memory_restart: "500M", // Restart if process exceeds 500MB
      load_balancing: {
        strategy: "round-robin", // Distribute requests evenly
        max_requests_per_instance: 1000, // Prevent single instance overload
        max_concurrent_requests: 50, // Limit concurrent requests per instance
      },
      env: {
        NODE_ENV: "production",
        TZ: "Asia/Calcutta",
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "DD-MM-YYYY HH:mm:ss A",
      watch: false, // Disable watching in production
      // Advanced load distribution settings
      instance_var: "INSTANCE_ID",
      min_uptime: "60s",
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
