module.exports = {
  apps: [{
    name: 'wattnbeaber-api',
    script: './src/server.js',  // Ruta relativa correcta
    cwd: '/home/watt/wattnbeaber/backend',  // Directorio de trabajo
    instances: 1,
    exec_mode: 'fork',  // ← AGREGAR ESTA LÍNEA
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    error_file: './logs/api-error.log',
    out_file: './logs/api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};