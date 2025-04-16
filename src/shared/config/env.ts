export const DOMAIN = process.env.NEXT_PUBLIC_VERCEL_URL || 'localhost:3000'
export const IS_LOCAL = DOMAIN.includes('localhost')
export const BASE_URL = `http${IS_LOCAL ? '' : 's'}://${DOMAIN}/`
export const BASE_API = BASE_URL.concat('api/')

