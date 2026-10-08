// ESLint düz yapılandırma. Kalite kapısının parçasıdır (CI: `pnpm lint`).
//
// Mimari kurallar (F06 WEB-1a kapsam 2; platform.md §5):
//  1. Sınır kuralı (eslint-plugin-boundaries): `shared` yalnız `shared`'ı görür;
//     modüller birbirini yalnız `public.ts` üzerinden görür; `app` modüllere yalnız
//     `public.ts` üzerinden erişir.
//  2. Belirteç yalnız bellekte: `localStorage` / `sessionStorage` yasak (bütün `src/`).
//  3. Elle DTO yok: `src/modules/**/api/**` içinde interface / tip literali yazılmaz;
//     tipler yalnız üretilmiş `src/shared/api/schema.d.ts`'ten türetilir.
// Kuralların gerçekten yakaladığı tests/lint/architecture.test.ts ile kanıtlanır.
import boundaries from 'eslint-plugin-boundaries'
import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from 'eslint-config-prettier/flat'
import globals from 'globals'

const storageMessage =
  'Tarayıcı depolaması yasak: belirteç ve oturum verisi yalnız bellekte tutulur (CLAUDE.md).'

export const storageBan = {
  'no-restricted-globals': [
    'error',
    { name: 'localStorage', message: storageMessage },
    { name: 'sessionStorage', message: storageMessage },
  ],
  'no-restricted-syntax': [
    'error',
    {
      selector: 'MemberExpression[property.name=/^(localStorage|sessionStorage)$/]',
      message: storageMessage,
    },
    {
      selector: 'MemberExpression[property.value=/^(localStorage|sessionStorage)$/]',
      message: storageMessage,
    },
  ],
}

const dtoMessage =
  'Elle DTO yazılmaz: modül api/ katmanı tipleri yalnız @/shared/api (schema.d.ts) üzerinden türetir.'

export default defineConfigWithVueTs(
  {
    name: 'nizamio/ignores',
    ignores: [
      '.backend/**',
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'src/shared/api/schema.d.ts',
      'src/shared/api/*.gen.ts',
      'src/shared/tokens/*.gen.ts',
    ],
  },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommendedTypeChecked,
  {
    name: 'nizamio/genel',
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    name: 'nizamio/node-betikleri',
    files: ['*.config.{js,ts}', 'scripts/**', 'e2e/**', 'tests/**'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    name: 'nizamio/depolama-yasagi',
    files: ['src/**/*.{ts,vue}'],
    rules: storageBan,
  },
  {
    name: 'nizamio/elle-dto-yasagi',
    files: ['src/modules/**/api/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...storageBan['no-restricted-syntax'].slice(1),
        { selector: 'TSInterfaceDeclaration', message: dtoMessage },
        { selector: 'TSTypeLiteral', message: dtoMessage },
      ],
    },
  },
  {
    name: 'nizamio/sinirlar',
    files: ['src/**/*.{ts,vue}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: './tsconfig.app.json' },
      },
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        { type: 'shared', pattern: 'src/shared' },
        { type: 'module', pattern: 'src/modules/*', capture: ['moduleName'] },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message:
            'Sınır ihlali: {{from.element.types}} → {{to.element.types}} ({{dependency.source}}). ' +
            "shared yalnız shared'ı; modüller birbirini yalnız public.ts üzerinden görür.",
          policies: [
            // Dış paketler serbest.
            { allow: { to: { module: { origin: ['external', 'core'] } } } },
            // Bir elemanın kendi iç dosyaları.
            { allow: { dependency: { relationship: { to: 'internal' } } } },
            // Kök dosyalar (src/main.ts, src/*.d.ts) bir elemana ait değildir; app ve shared'ı görür.
            {
              from: { element: { isUnknown: true } },
              allow: { to: { element: { type: ['app', 'shared'] } } },
            },
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { type: 'shared' } } },
            },
            { from: { element: { type: 'app' } }, allow: { to: { element: { type: 'shared' } } } },
            {
              from: { element: { type: 'app' } },
              allow: { to: { element: { type: 'module', fileInternalPath: 'public.ts' } } },
            },
            {
              from: { element: { type: 'module' } },
              allow: { to: { element: { type: 'shared' } } },
            },
            {
              from: { element: { type: 'module' } },
              allow: { to: { element: { type: 'module', fileInternalPath: 'public.ts' } } },
            },
          ],
        },
      ],
    },
  },
  skipFormatting,
)
