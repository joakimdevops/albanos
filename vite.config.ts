import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

/**
 * Plugin para isolar ferramentas e modais de teste/diagnóstico exclusivamente
 * no ambiente de desenvolvimento, garantindo zero impacto no bundle de produção.
 */
function devOnlyDiagnosticsPlugin(isProduction: boolean): Plugin {
  const virtualModuleId = 'virtual:dev-only-empty-test-modal';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'vite-dev-only-diagnostics',
    enforce: 'pre',
    resolveId(id) {
      if (isProduction && id.includes('EngineTestRunnerModal')) {
        return resolvedVirtualModuleId;
      }
      return null;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return 'export const EngineTestRunnerModal = () => null;\nexport default EngineTestRunnerModal;';
      }
      return null;
    },
  };
}

export default defineConfig(({ command }) => {
  const isProduction = command === 'build';

  return {
    plugins: [
      devOnlyDiagnosticsPlugin(isProduction),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
