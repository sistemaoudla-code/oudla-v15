module.exports = {
  apps: [{
    name: 'oudla',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      TRUST_PROXY: 'true',
    },
    env_file: '.env',
    max_memory_restart: '512M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    merge_logs: true,
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s',
  }],
};
