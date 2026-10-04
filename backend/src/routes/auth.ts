import { Router } from 'express';
import { limit } from '../lib/rate-limit.js';
import { requireMerchant } from '../middleware/auth.js';
import * as authController from '../controllers/auth.controller.js';

export const authRouter = Router();

// --- Register + e-mail OTP verification ---------------------------------------------------------
authRouter.post('/register', limit('register', 30, 60 * 60_000), authController.register);
authRouter.post('/verify-otp', limit('verify-otp-ip', 30, 15 * 60_000), authController.verifyOtp);

// --- Login / logout / session --------------------------------------------------------------------
authRouter.post('/login', limit('login-ip', 10, 5 * 60_000), authController.login);
authRouter.post('/logout', authController.logout);
authRouter.get('/session', authController.getCurrentSession);

/**
 * Everything the server-rendered dashboard/landing pages need about the logged-in merchant in one call.
 * 401 when there is no valid session.
 */
authRouter.get('/context', requireMerchant, authController.getContext);

// --- Password reset (single-use, time-limited link that revokes all sessions when used) ----------
authRouter.post('/forgot-password', limit('forgot-ip', 3, 60 * 60_000), authController.forgotPassword);
authRouter.post('/reset-password', limit('reset-ip', 10, 60 * 60_000), authController.resetPassword);

// --- Team invitations ------------------------------------------------------------------------------
authRouter.get('/invite-info', limit('invite-info', 30, 10 * 60_000), authController.getInviteInfo);
authRouter.post('/accept-invite', limit('accept-invite', 10, 15 * 60_000), authController.acceptInvite);

authRouter.post('/set-password', requireMerchant, limit('set-password', 10, 15 * 60_000), authController.setPassword);

// --- Profile / store switching -----------------------------------------------------------------
authRouter.post('/switch-store', requireMerchant, authController.switchStore);
authRouter.post('/update-name', requireMerchant, authController.updateName);
