import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import noRelativeImports from "eslint-plugin-no-relative-import-paths";
import prettier from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default defineConfig([
    {
        ignores: ["**/node_modules/**", "**/dist/**", "**/*.d.ts", "**/.agents/**", "**/.claude/**", "commitlint.config.ts"],
    },
    prettier,
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        plugins: {
            import: importPlugin,
            "no-relative-import-paths": noRelativeImports,
        },
        settings: {
            "import/resolver": {
                typescript: {},
            },
        },
        rules: {
            "no-multi-spaces": "error",
            "no-empty-function": "off",
            "prettier/prettier": "error",
            eqeqeq: ["error", "always"],
            "no-case-declarations": "error",
            "no-confusing-arrow": "error",
            "no-else-return": "error",
            "no-var": "error",
            "object-shorthand": ["error", "always"],
            "prefer-arrow-callback": "error",
            "prefer-const": "error",
            "prefer-template": "error",
            "spaced-comment": ["error", "always"],
            yoda: "error",

            // Import
            "import/no-duplicates": "error",
            "import/no-absolute-path": "error",
            "import/no-namespace": "error",
            "import/first": "error",
            "import/no-anonymous-default-export": "error",
            "import/order": [
                "error",
                {
                    "newlines-between": "always",
                    groups: ["type", "index", "sibling", "parent", "internal", "external", "builtin", "object"],
                    alphabetize: {
                        order: "asc",
                        caseInsensitive: true,
                    },
                },
            ],

            // No relative imports
            "no-relative-import-paths/no-relative-import-paths": [
                "error",
                {
                    allowSameFolder: false,
                    rootDir: "src",
                    prefix: "@",
                },
            ],

            // TypeScript
            "@typescript-eslint/no-restricted-types": "error",
            "@typescript-eslint/no-extra-non-null-assertion": "error",
            "@typescript-eslint/no-import-type-side-effects": "error",
            "@typescript-eslint/consistent-indexed-object-style": ["error", "record"],
            "@typescript-eslint/consistent-type-definitions": ["error", "type"],
            "@typescript-eslint/consistent-type-imports": [
                "error",
                {
                    prefer: "type-imports",
                    disallowTypeAnnotations: true,
                    fixStyle: "separate-type-imports",
                },
            ],
            "@typescript-eslint/array-type": [
                "error",
                {
                    default: "array",
                },
            ],
        },
    },
]);
