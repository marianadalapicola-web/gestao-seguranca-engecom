import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { ValidationError } from '../../utils/errors';
import { AVATAR_UPLOAD_ROOT } from '../../lib/attachmentStorage';
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  removeAvatar,
  resetPassword,
  updateProfile,
  uploadAvatar,
} from './controller';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from './schema';

const ALLOWED_AVATAR_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_AVATAR_SIZE_BYTES = 4 * 1024 * 1024; // 4MB — é uma foto de perfil, não um anexo técnico.

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, AVATAR_UPLOAD_ROOT),
    filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname).slice(0, 10)}`),
  }),
  limits: { fileSize: MAX_AVATAR_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_AVATAR_MIME.has(file.mimetype)) {
      cb(new ValidationError('Envie uma imagem JPG, PNG ou WEBP.'));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.post('/login', validate({ body: loginSchema }), login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), resetPassword);
router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), changePassword);
router.patch('/profile', authenticate, validate({ body: updateProfileSchema }), updateProfile);
router.post('/avatar', authenticate, avatarUpload.single('file'), uploadAvatar);
router.delete('/avatar', authenticate, removeAvatar);

export default router;
