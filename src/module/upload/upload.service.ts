// src/upload/upload.service.ts
import { Injectable } from '@nestjs/common';
import { s3Client } from 'src/config/s3.config';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as mime from 'mime-types';

@Injectable()
export class UploadService {
  async uploadFile(file: Express.Multer.File, bucket: string, userId: string): Promise<string> {
    const extension = mime.extension(file.mimetype) || 'bin';
    const fileName = `${userId}/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentDisposition: 'inline',
      ACL: 'public-read',
    });

    await s3Client.send(command);

    const endpoint = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT;
    return `${endpoint}/${bucket}/${fileName}`;
  }
}
