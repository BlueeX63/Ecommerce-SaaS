import { Router } from 'express';
import { limit } from '../lib/rate-limit.js';
import { optionalShopper, requireShopper } from '../middleware/auth.js';
import * as storeController from '../controllers/store.controller.js';
import * as reviewsController from '../controllers/reviews.controller.js';

export const storeRouter = Router();

// --- Cart ----------------------------------------------------------------------------------------
storeRouter.get('/cart', requireShopper, storeController.getCart);
storeRouter.post('/cart', requireShopper, limit('cart', 60, 60_000, (req) => req.shopper?.customerId), storeController.addCartItem);
storeRouter.delete('/cart', requireShopper, storeController.removeCartItem);

// --- Wishlist --------------------------------------------------------------------------------------
storeRouter.get('/wishlist', requireShopper, storeController.getWishlist);
storeRouter.post('/wishlist', requireShopper, limit('wishlist', 60, 60_000, (req) => req.shopper?.customerId), storeController.addWishlistItem);
storeRouter.delete('/wishlist', requireShopper, storeController.removeWishlistItem);

// --- Addresses / profile ---------------------------------------------------------------------------
storeRouter.get('/addresses', requireShopper, storeController.listAddresses);
storeRouter.post('/addresses', requireShopper, storeController.addAddress);
storeRouter.get('/profile', requireShopper, storeController.getProfile);

// --- Orders & checkout (always priced server-side) ------------------------------------------------
storeRouter.get('/orders', requireShopper, storeController.listOrders);
storeRouter.post('/orders/:id/cancel', requireShopper, storeController.cancelOrder);
storeRouter.post('/orders/:id/return', requireShopper, storeController.requestReturn);
storeRouter.post('/orders', requireShopper, limit('place-order', 10, 60_000, (req) => req.shopper?.customerId), storeController.createOrder);
storeRouter.post('/checkout', requireShopper, limit('checkout', 5, 60_000, (req) => req.shopper?.customerId), storeController.checkout);

// --- Reviews (written from the order-detail page) --------------------------------------------------
storeRouter.post('/reviews', requireShopper, limit('review', 10, 60 * 60_000, (req) => req.shopper?.customerId), storeController.createOrderReview);

// --- Coupons & delivery options (readable without logging in) --------------------------------------
storeRouter.post('/coupons/validate', optionalShopper, limit('coupon-validate', 20, 60_000), storeController.validateCoupon);
storeRouter.get('/coupons/public', optionalShopper, storeController.listPublicCoupons);
storeRouter.get('/delivery-options', optionalShopper, storeController.listDeliveryOptions);

// ---------------------------------------------------------------------------------------------
// /api/v1/reviews  (public read of approved reviews; write requires a logged-in shopper)
// ---------------------------------------------------------------------------------------------
export const reviewsRouter = Router();

reviewsRouter.get('/', reviewsController.listProductReviews);
reviewsRouter.post('/', requireShopper, limit('review', 10, 60 * 60_000, (req) => req.shopper?.customerId), reviewsController.createReview);
