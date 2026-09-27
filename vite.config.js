import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'path';

export default defineConfig({
    plugins: [preact()],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            'react': 'preact/compat',
            'react-dom': 'preact/compat',
            'react-dom/test-utils': 'preact/test-utils',
            'react/jsx-runtime': 'preact/jsx-runtime'
        }
    },
    server: { host: '0.0.0.0', port: 5173, cors: true },
    preview: { host: '0.0.0.0', port: 4173 },
    build: { outDir: 'dist', sourcemap: false, target: 'es2020' },
    publicDir: 'public'
});
