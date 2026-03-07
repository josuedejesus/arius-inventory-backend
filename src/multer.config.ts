import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads/item-units',
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname);
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Solo se permiten imágenes'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};
