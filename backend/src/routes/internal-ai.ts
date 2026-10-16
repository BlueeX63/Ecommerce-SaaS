import { Router } from 'express';
import * as internalAiController from '../controllers/internal-ai.controller.js';

/**
 * Called only by the AI service, never by browsers. Authorised per request by the signed tool token (see
 * services/ai/tool-token.ts), which names the store and shopper and expires. No rate limiter on purpose: each
 * assistant run is already capped (rounds, tools per round) and a limiter would add a Redis hop to every tool call.
 */
export const internalAiRouter = Router();

internalAiRouter.post('/tools/:name', internalAiController.runTool);
