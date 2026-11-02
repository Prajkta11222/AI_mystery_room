import { createVercelConfig } from './vercel-config.js';

export default createVercelConfig(process.env.API_ORIGIN);
