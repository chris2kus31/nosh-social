import axios from 'axios';

/**
 * Axios instance for NON-Supabase HTTP only (e.g. reverse geocoding,
 * third-party APIs). All Supabase access goes through `supabase` in
 * ./supabase.ts so that auth, RLS, and our RPC functions are respected.
 */
export const api = axios.create({
  timeout: 15_000,
});
