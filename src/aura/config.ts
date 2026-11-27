// Where Aura's conversation is answered: the luminary-aura Supabase function.
// Both values are public by design (the anon key only lets the app call the function).
// Set them here once the function is live, or with EXPO_PUBLIC_AURA_ENDPOINT / EXPO_PUBLIC_AURA_KEY
// at build time. Empty means "not live yet", and the app says so plainly.
export const AURA_ENDPOINT: string = process.env.EXPO_PUBLIC_AURA_ENDPOINT ?? '';
export const AURA_KEY: string = process.env.EXPO_PUBLIC_AURA_KEY ?? '';
