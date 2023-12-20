import { defineConfig } from 'vite';
import { getConfig } from '../../vite.lib.config';

export default defineConfig(getConfig(__dirname, 'data-portal-utils') as any);
