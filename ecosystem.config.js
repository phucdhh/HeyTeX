module.exports = {
  apps: [
    {
      name: 'heytex-backend',
      cwd: '/Users/mac/heytex/server',
      // Use the compiled production bundle to avoid runtime tsx/interpreter issues
      script: '/Users/mac/heytex/server/dist/index.js',
      interpreter: 'node',
      // Run single instance in fork mode for predictable startup and port binding
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: '/tmp/heytex-backend-error.log',
      out_file: '/tmp/heytex-backend.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'heytex-texlive',
      cwd: '/Users/mac/heytex',
      script: 'texlive-server.js',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        PORT: '5435',
      },
      error_file: '/tmp/texlive-server-error.log',
      out_file: '/tmp/texlive-server.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'heytex-minio',
      cwd: '/Users/mac/heytex',
      script: 'minio',
      args: 'server data/minio --address :5434 --console-address :5437',
      interpreter: 'none',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        MINIO_ROOT_USER: 'heytex_admin',
        MINIO_ROOT_PASSWORD: 'heytex_minio_2024',
      },
      error_file: '/tmp/minio-error.log',
      out_file: '/tmp/minio.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
