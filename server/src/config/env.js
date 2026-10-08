import 'dotenv/config';

const required = (key, fallback = '') => {
  const val = process.env[key];
  if (!val && !fallback) {
    if (process.env.NODE_ENV === 'test' || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      return `dev-${key.toLowerCase().replace(/_/g, '-')}`;
    }
    throw new Error(`Missing required env var: ${key}`);
  }
  return val || fallback;
};

const optional = (key, fallback) => process.env[key] || fallback;

export const env = {
  port: parseInt(optional('PORT', '3001'), 10),
  nodeEnv: optional('NODE_ENV', 'development'),
  isDev: optional('NODE_ENV', 'development') === 'development',

  supabase: {
    url: required('SUPABASE_URL', 'https://placeholder.supabase.co'),
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || required('SUPABASE_ANON_KEY', 'placeholder-anon-key'),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || required('SUPABASE_SERVICE_ROLE_KEY', 'placeholder-service-role-key'),
    publishableKey: optional('SUPABASE_PUBLISHABLE_KEY', ''),
    secretKey: optional('SUPABASE_SECRET_KEY', ''),
    jwksUrl: optional('SUPABASE_JWKS_URL', ''),
  },

  database: {
    url: required('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/campusflow'),
  },

  jwt: {
    secret: required('JWT_SECRET', 'dev-jwt-secret-key-32-chars-long-campusflow'),
  },

  gemini: {
    apiKey: optional('GEMINI_API_KEY', ''),
  },

  auth: {
    tempAdminEmail: optional('CAMPUSFLOW_TEMP_ADMIN_EMAIL', 'admin@campusflow.local'),
    tempAdminPassword: optional('CAMPUSFLOW_TEMP_ADMIN_PASSWORD', ''),
    enableDemoAuth: optional('CAMPUSFLOW_ENABLE_DEMO_AUTH', 'false') === 'true',
  },
};

