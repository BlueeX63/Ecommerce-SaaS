import { Router } from 'express';
import { limit } from '../lib/rate-limit.js';
import { requireMerchant } from '../middleware/auth.js';
import * as apiKeysController from '../controllers/api-keys.controller.js';

/**
 * Merchant-facing API key management.
 *
 * Keys are shown to the merchant exactly once, at creation. Only a SHA-256 hash is ever stored (in the
 * existing `api_keys.api_key` column) - not the raw secret - so a database read can never recover a usable
 * key, matching how GitHub/Stripe-style tokens are handled.
 *
 * Note: this issues and revokes keys, but nothing in this codebase yet authenticates incoming requests
 * against them - there is no public REST surface that accepts `X-API-Key`. Wiring that up (a versioned
 * public API + an auth middleware that hashes the presented key and looks it up here) is a separate,
 * larger feature than the key-management UI itself.
 */
export const apiKeysRouter = Router();
apiKeysRouter.use(requireMerchant);

apiKeysRouter.get('/', apiKeysController.list);
apiKeysRouter.post('/', limit('api-key-create', 20, 60 * 60_000, (req) => req.merchant?.userId), apiKeysController.create);
apiKeysRouter.patch('/:id', apiKeysController.toggleActive);
apiKeysRouter.delete('/:id', apiKeysController.remove);
