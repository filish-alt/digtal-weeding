import { Controller, Post, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomBytes } from 'crypto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const getUploadDir = () => {
  const baseDir =
    process.cwd().includes('apps\\api') || process.cwd().includes('apps/api')
      ? process.cwd()
      : join(process.cwd(), 'apps/api');
  const uploadDir = join(baseDir, 'public', 'uploads');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, getUploadDir());
        },
        filename: (req: Request, file: Express.Multer.File, cb: (error: any, filename: string) => void) => {
          const ext = extname(file.originalname);
          const name = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MiB
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        cb(null, allowed.includes(file.mimetype));
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    const url = `/uploads/${file.filename}`;
    return { url };
  }
}
