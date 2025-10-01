import js from "@eslint/js";
import globals from "globals";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import sonarJsPlugin from "eslint-plugin-sonarjs";
import unusedImports from "eslint-plugin-unused-imports";

export default [
	// Main config for source files
	{
		ignores: ["build/dev/**", "build/prod/**", "build/offline/**", "eslint.config.js"],
	},
	{
		files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			parser: tsParser,
			parserOptions: {
				project: ["./tsconfig.json"],
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				...globals.browser,
				...globals.node,
				...globals.jest,
			},
		},
		plugins: {
			"@typescript-eslint": tsPlugin,
			"unused-imports": unusedImports,
			sonarjs: sonarJsPlugin,
			import: importPlugin,
		},
		rules: {
			...js.configs.recommended.rules,
			...tsPlugin.configs.recommended.rules,
			...sonarJsPlugin.configs.recommended.rules,
			"@typescript-eslint/no-explicit-any": "off", // Allow 'any' type for flexibility
			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/no-empty-object-type": "off",
			"@typescript-eslint/no-unused-expressions": "off",
			"@typescript-eslint/no-this-alias": "off",
			"@typescript-eslint/no-unsafe-function-type": "off",
			"@typescript-eslint/no-unnecessary-type-constraint": "off", // TODO: review if we need this
			"@typescript-eslint/no-wrapper-object-types": "off", // TODO: review if we need this
			"unused-imports/no-unused-imports": "error",
			"jest/no-conditional-expect": "off",
			"no-useless-escape": "off",
			"no-case-declarations": "off", // TODO: remove in the future, and fix the code
			"no-empty": "off", // Allow empty blocks for now, can be useful in some cases
			"no-async-promise-executor": "off", // Allow async functions to return promises
			"no-undef": "off", // TypeScript handles undefined variables
			"no-extra-boolean-cast": "off",
			"no-prototype-builtins": "off",
			"@typescript-eslint/no-namespace": "off",
			"import/no-unresolved": "off",
			"no-empty-function": "error",
			"@typescript-eslint/consistent-type-assertions": [
				"error",
				{
					assertionStyle: "as",
				},
			],
			"@typescript-eslint/consistent-type-imports": [
				"error",
				{
					prefer: "type-imports",
				},
			],
			"@typescript-eslint/await-thenable": "error",
			"no-self-assign": "error",
			"sonarjs/prefer-single-boolean-return": "off",
			"sonarjs/no-duplicate-string": "off",
			"sonarjs/no-collapsible-if": "off",
			"sonarjs/no-inverted-boolean-check": "off",
			"sonarjs/no-small-switch": "off",
			"sonarjs/no-nested-template-literals": "off",
			"sonarjs/no-nested-switch": "off",
			"sonarjs/prefer-nullish-coalescing": "off",
			"sonarjs/no-nested-functions": "off",
			"sonarjs/slow-regex": "off",
			"sonarjs/no-alphabetical-sort": "off",
			"sonarjs/pseudo-random": "off",
			"sonarjs/todo-tag": "off", // Turn on in the future maybe!
			"sonarjs/no-commented-code": "off",
			"sonarjs/no-nested-conditional": "off",
			"sonarjs/cognitive-complexity": "off", // Turn on in the future maybe!
			"sonarjs/no-selector-parameter": "off",
			"sonarjs/prefer-regexp-exec": "off",
			"sonarjs/concise-regex": "off",
			"sonarjs/regex-complexity": "off",
			"sonarjs/use-type-alias": "off",
			"sonarjs/no-dead-store": "off", // TODO: remove in the future, and fix the code
			"sonarjs/no-unused-vars": "off", // TODO: remove in the future, and fix the code
			"sonarjs/jsx-no-leaked-render": "off", // TODO: remove in the future, and fix the code
			"sonarjs/function-return-type": "off",
			"sonarjs/no-ignored-exceptions": "off",
			"sonarjs/duplicates-in-character-class": "off", // TODO: remove in the future, and fix the code
			curly: "error",
			"import/no-named-as-default": "off",
			"eol-last": ["error", "always"],
			"space-infix-ops": "error",
			"linebreak-style": ["error", "unix"],
			"no-multiple-empty-lines": [
				"error",
				{
					max: 2,
					maxEOF: 1,
					maxBOF: 0,
				},
			],
			"no-extra-semi": "error",
			"no-unreachable": "error",
			"prefer-template": "error",
			"no-useless-concat": "error",
			"require-await": "error",
			"no-return-await": "error",
			"no-alert": ["error"],
			"dot-location": ["warn", "property"],
			"import/no-cycle": "error",
			"import/no-self-import": "error",
			"import/no-duplicates": "error",
			"import/order": "error",
			"no-unneeded-ternary": "error",
		},
		settings: {
			react: {
				version: "detect",
			},
		},
	},
];
