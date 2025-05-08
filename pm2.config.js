module.exports = {
  apps: [
    {
      name: "car-booking-system",
      script: "start.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};