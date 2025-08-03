// module.exports = {
//   apps: [
//     {
//       name: "dashboard-api",
//       script: "./dist/src/main.js",
//       instances: "max", // Matches your 8-core CPU
//       exec_mode: "cluster",
//       max_memory_restart: "500M", // Restart if process exceeds 500MB
//       load_balancing: {
//         strategy: "round-robin", // Distribute requests evenly
//         max_requests_per_instance: 1000, // Prevent single instance overload
//         max_concurrent_requests: 50, // Limit concurrent requests per instance
//       },
//       env: {
//         NODE_ENV: "production",
//         TZ: "Asia/Calcutta",
//       },
//       error_file: "./logs/err.log",
//       out_file: "./logs/out.log",
//       log_date_format: "DD-MM-YYYY HH:mm:ss A",
//       watch: false, // Disable watching in production
//       // Advanced load distribution settings
//       instance_var: "INSTANCE_ID",
//       min_uptime: "60s",
//       max_restarts: 10,
//       restart_delay: 4000,

//       // Log rotation settings
//       merge_logs: true,
//       log_file: "./logs/combined.log",
//       log_rotate_interval: "0 0 * * 0", // Run at midnight every Sunday (cron format)
//       log_max_size: "50M", // Size threshold for rotation
//       log_retain_count: 5, // Only keep 5 rotated log file (effectively deleting logs older than 5 week)
//     },
//   ],
// };

module.exports = {
  // apps: [
  //   {
  //     name: "dashboard-api",
  //     script: "./dist/src/main.js",
      
  //     // CRITICAL CHANGES FOR MEMORY/PERFORMANCE
  //     instances: 4, // Changed from "max" - optimal for 8-core with memory constraints
  //     exec_mode: "cluster",
  //     max_memory_restart: "400M", // Reduced from 500M - more aggressive cleanup
      
  //     // PROPER RESTART HANDLING
  //     kill_timeout: 5000,        // Force kill after 5s if graceful shutdown fails
  //     wait_ready: true,          // Wait for app to be ready before considering it online
  //     listen_timeout: 10000,     // Timeout for app to become ready
  //     min_uptime: "10s",         // Minimum uptime before considering stable
  //     max_restarts: 5,           // Reduced from 10 - prevent restart loops
  //     restart_delay: 2000,       // Reduced delay between restarts
      
  //     // MEMORY OPTIMIZATION
  //     node_args: [
  //       "--max-old-space-size=512",  // Limit V8 heap to 512MB
  //       "--optimize-for-size",       // Optimize for memory usage over speed
  //       "--gc-interval=100"          // More frequent garbage collection
  //     ],
      
  //     // REMOVE INVALID PM2 OPTIONS (these don't exist in PM2)
  //     // load_balancing: { ... } // ❌ This is not a valid PM2 option
  //     // max_requests_per_instance: ... // ❌ Not valid
  //     // max_concurrent_requests: ... // ❌ Not valid
  //     // log_rotate_interval: ... // ❌ Use logrotate instead
  //     // log_max_size: ... // ❌ Not valid
  //     // log_retain_count: ... // ❌ Not valid
      
  //     // ENVIRONMENT
  //     env: {
  //       NODE_ENV: "production",
  //       TZ: "Asia/Calcutta",
  //       UV_THREADPOOL_SIZE: 16,    // Increase thread pool for I/O operations
  //     },
      
  //     // LOGGING (Simplified and valid)
  //     error_file: "./logs/err.log",
  //     out_file: "./logs/out.log",
  //     log_file: "./logs/combined.log",
  //     log_date_format: "YYYY-MM-DD HH:mm:ss",
  //     merge_logs: true,
      
  //     // ADVANCED SETTINGS
  //     watch: false,
  //     instance_var: "INSTANCE_ID",
      
  //     // GRACEFUL SHUTDOWN
  //     shutdown_with_message: true,
      
  //     // AUTO RESTART CONDITIONS
  //     cron_restart: "0 2 * * *",  // Daily restart at 2 AM for memory cleanup
      
  //     // RESOURCE LIMITS (if your system supports it)
  //     max_open_files: 1024,
  //   },
  // ],

  apps: [{
    name: "dashboard-api",
    script: "./dist/src/main.js",
    instances: 4,
    exec_mode: "cluster",
    max_memory_restart: "400M",
    
    // CRITICAL: Add these to prevent PID issues
    kill_timeout: 5000,
    wait_ready: true,
    min_uptime: "10s",
    max_restarts: 3,  // Lower limit to prevent corruption
    
    env: {
      NODE_ENV: "production"
    }
  }]

  // DEPLOYMENT CONFIGURATION (Optional but recommended)
  // deploy: {
  //   production: {
  //     user: 'ubuntu',
  //     host: 'your-server-ip',
  //     ref: 'origin/main',
  //     repo: 'your-git-repo',
  //     path: '/home/ubuntu/dashboard-api',
  //     'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
  //   }
  // }
};