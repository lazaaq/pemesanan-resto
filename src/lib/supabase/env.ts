function requireEnv(name: string, value: string | undefined) {
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

function getSupabasePublicKeyValue() {
    return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function hasSupabasePublicEnv() {
    return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && getSupabasePublicKeyValue());
}

export function getSupabasePublicEnv() {
    return {
        url: requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
        anonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', getSupabasePublicKeyValue()),
    };
}

export function getSupabaseServiceRoleKey() {
    return requireEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
}
