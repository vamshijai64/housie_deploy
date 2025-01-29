module.exports = {
  apps: [
    {
      name: "housi_backend",
      script: "./bin/www",
      instances: "1",
      autorestart: true,
      watch: true,
      ignore_watch:["uploads"],
      max_memory_restart: "2G",
      // env: {
      //     NODE_ENV: 'development'
      // },
      // env_production: {
      //     NODE_ENV: 'production'
      // }
    },
  ],
};