import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '3001'),
    nodeEnv: process.env.NODE_ENV || 'development',

    jwt: {
        secret: process.env.JWT_SECRET || 'default_secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },

    minio: {
        endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
        port: parseInt(process.env.MINIO_PORT || '9000'),
        accessKey: process.env.MINIO_ACCESS_KEY || '',
        secretKey: process.env.MINIO_SECRET_KEY || '',
        useSSL: process.env.MINIO_USE_SSL === 'true',
        bucketAssets: process.env.MINIO_BUCKET_ASSETS || 'heytex-assets',
        bucketProjects: process.env.MINIO_BUCKET_PROJECTS || 'heytex-projects',
    },

    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    },
};
