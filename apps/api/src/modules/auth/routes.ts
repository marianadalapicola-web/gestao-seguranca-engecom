import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  resetPassword,
  updateProfile,
} from './controller';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from './schema';

const router = Router();

router.post('/login', validate({ body: loginSchema }), login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), resetPassword);
router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), changePassword);
router.patch('/profile', authenticate, validate({ body: updateProfileSchema }), updateProfile);

export default router;
