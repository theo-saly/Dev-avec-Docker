import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { ignores: ["frontend/js/*.min.js", "frontend/js/react*.js", "frontend/css/**", "**/node_modules/**", "**/dist/**"] },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
  {
    files: ["frontend/js/**/*.js"],
    languageOptions: {
      globals: {
        React: "readonly",
        ReactDOM: "readonly",
        babel: "readonly",
        AuthCard: "readonly",
        TodoListCard: "readonly",
        LoginPage: "readonly",
        RegisterPage: "readonly",
        DashboardPage: "readonly",
        ProjectPage: "readonly",
        App: "readonly",
        normalizePath: "readonly",
        matchProjectPath: "readonly",
        buildHeaders: "readonly",
        apiUrl: "readonly",
        getUserIdFromToken: "readonly",
        parseApiResponse: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
    },
  },
]);
