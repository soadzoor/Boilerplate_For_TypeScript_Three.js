import {defineConfig} from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
	css: {
		preprocessorOptions: {
			scss: {},
		},
		devSourcemap: true,
	},
	optimizeDeps: {
		esbuildOptions: {
			target: "es2022",
		},
	},
	plugins: [
		tsconfigPaths({root: "./"}),
	],
});
