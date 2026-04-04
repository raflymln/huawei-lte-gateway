import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier/recommended";
import noRelativeImports from "eslint-plugin-no-relative-import-paths";

export default tseslint.config(js.configs.recommended, tseslint.configs.recommended, prettier, {
    ignores: ["**/node_modules/**", "**/dist/**", "**/*.d.ts"],
    languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
            ecmaFeatures: { jsx: false },
            ecmaVersion: 2020,
            sourceType: "module",
        },
    },
    plugins: {
        "no-relative-import-paths": noRelativeImports,
    },
    rules: {
        "no-console": "warn",
        "no-unused-vars": "warn",
        "no-var": "error",
        "prefer-const": "error",
        "import/no-duplicates": "error",
        "import/no-absolute-path": "error",
        "import/no-namespace": "error",
        "import/order": [
            "error",
            {
                groups: ["builtin", "external", "internal"],
                newlinesBetween: "always",
                alphabetize: { order: "asc", caseInsensitive: true },
            },
        ],
        "no-relative-import-paths/no-relative-import-paths": [
            "error",
            {
                allowSameFolder: false,
                rootDir: "src",
                prefix: "@",
            },
        ],
    },
});
