import { randomBytes } from 'node:crypto';
export function createInvitationToken() { return randomBytes(32).toString('hex'); }
export function isToken(token: string) { return /^[a-f0-9]{64}$/.test(token); }
