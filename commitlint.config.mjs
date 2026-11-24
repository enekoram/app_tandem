// Commits en castellano con prefijo convencional (feat:, fix:, chore:, test:, docs:…)
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // El asunto va en castellano y puede empezar por mayúscula o nombre propio
    'subject-case': [0],
    'body-max-line-length': [0],
  },
};
