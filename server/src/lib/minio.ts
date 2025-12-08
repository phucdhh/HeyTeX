import * as Minio from 'minio';
import { config } from '../config/index.js';

export const minioClient = new Minio.Client({
    endPoint: config.minio.endPoint,
    port: config.minio.port,
    useSSL: config.minio.useSSL,
    accessKey: config.minio.accessKey,
    secretKey: config.minio.secretKey,
});

export async function uploadFile(
    bucket: string,
    objectName: string,
    buffer: Buffer,
    mimeType: string
): Promise<string> {
    await minioClient.putObject(bucket, objectName, buffer, buffer.length, {
        'Content-Type': mimeType,
    });
    return objectName;
}

export async function getFileUrl(bucket: string, objectName: string): Promise<string> {
    return await minioClient.presignedGetObject(bucket, objectName, 24 * 60 * 60); // 24 hours
}

export async function deleteFile(bucket: string, objectName: string): Promise<void> {
    await minioClient.removeObject(bucket, objectName);
}
