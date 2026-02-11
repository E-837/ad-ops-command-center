module.exports = {
  apps: [
    {
      name: 'ad-ops-command',
      script: 'server.js',
      watch: false,
      max_restarts: 10,
      restart_delay: 2000,
      env: {
        PORT: 3002,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'landing-page',
      script: 'serve-landing.js',
      watch: ['output/landing-page.html'],
      max_restarts: 10,
      restart_delay: 2000,
      env: {
        PORT: 3003
      }
    }
  ]
};