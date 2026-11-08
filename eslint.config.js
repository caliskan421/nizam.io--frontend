// ESLint düz yapılandırma. Kalite kapısının parçasıdır (CI: `pnpm lint`).
//
// Mimari kurallar (F06 WEB-1a kapsam 2; platform.md §5):
//  1. Sınır kuralı (eslint-plugin-boundaries): `shared` yalnız `shared`'ı görür;
//     modüller birbirini yalnız `public.ts` üzerinden görür; `app` modüllere yalnız
//     `public.ts` üzerinden erişir.
//  2. Belirteç yalnız bellekte: `localStorage` / `sessionStorage` yasak (bütün `src/`).
//  3. Elle DTO yok: `src/modules/**/api/**` içinde interface / tip literali yazılmaz;
//     tipler yalnız üretilmiş `src/shared/api/schema.d.ts`'ten türetilir.
//  4. Rol dizesi (K1): `'koordinator'` / `'uye'` dizeleri, `company_admin` okuması ve `.role`
//     karşılaştırması yalnız `src/modules/*/model/capabilities.ts` ve `src/shared/{scope,session}/standing*`.
//  5. Rol önekli rota yasağı (K10): `/admin/…`, `/koordinator/…`, `/uye/…` gibi yollar yok.
//  6. Boyut kapıları (K12): `.vue` 250 satırda uyarı / 400'de hata; fonksiyon 60 satır, karmaşıklık 12.
//  7. `designStub` (K13): kimlik dize literali `BE-NNN`, takma ad yok (kayıt testi statik okur).
//  4/5/7 ayrı yerel kural kimlikleridir (`nizamio/rol-dizesi`, `nizamio/rol-onekli-rota`,
//  `nizamio/design-stub-cagrisi`): dosya başı `no-restricted-syntax` istisnaları onları ezmez.
// Kuralların gerçekten yakaladığı tests/lint/*.test.ts ile kanıtlanır (negatif + kaçış örnekleri).
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

// --- Rol dizesi (K1) -------------------------------------------------------------------------
// Rol yalnız gösterim içindir; eylem görünürlüğü modülün capabilities.ts dosyasından okunur.
// Tip konumundaki literal (`type Lens = 'koordinator' | …`) karşılaştırma değildir, serbesttir.
// Test dosyaları (fikstür verisi) muaftır; üretim kodu muaf değildir.
export const ROLE_ALLOWED_FILES = [
  'src/modules/*/model/capabilities.ts',
  'src/shared/scope/standing*',
  'src/shared/session/standing*',
]
const SRC_TEST_FILES = ['src/**/*.test.ts']
const roleMessage =
  "Rol dizesi ('koordinator'/'uye'), company_admin okuması ve .role karşılaştırması yalnız " +
  'modules/*/model/capabilities.ts ve shared/{scope,session}/standing* içinde (K1). Capability kullanın.'
const ROLE_WORD = '(koordinator|uye)'
const roleSyntax = [
  {
    selector: `Literal[value=/^${ROLE_WORD}$/]:not(TSLiteralType > Literal)`,
    message: roleMessage,
  },
  {
    selector: `TemplateLiteral[expressions.length=0] > TemplateElement[value.cooked=/^${ROLE_WORD}$/]`,
    message: roleMessage,
  },
  // company_admin: nokta, köşeli parantez ve yapı bozma (takma ad dahil) okumaları.
  { selector: "MemberExpression[property.name='company_admin']", message: roleMessage },
  { selector: "MemberExpression[property.value='company_admin']", message: roleMessage },
  { selector: "ObjectPattern > Property[key.name='company_admin']", message: roleMessage },
  { selector: "ObjectPattern > Property[key.value='company_admin']", message: roleMessage },
  // .role karşılaştırması: sabit takma adla (`ROLE_C`) yapılan kaçışı da yakalar.
  {
    selector: "BinaryExpression[operator=/^[!=]==?$/] > MemberExpression[property.name='role']",
    message: roleMessage,
  },
  {
    selector: "BinaryExpression[operator=/^[!=]==?$/] > Identifier[name='role']",
    message: roleMessage,
  },
  {
    selector: "SwitchStatement > MemberExpression.discriminant[property.name='role']",
    message: roleMessage,
  },
  {
    selector:
      "CallExpression[callee.property.name='includes'] > MemberExpression.arguments[property.name='role']",
    message: roleMessage,
  },
]

// --- Rol önekli rota (K10) -------------------------------------------------------------------
// URL özelliğe göredir (`/gorevler`); rol öneki yok. Kök yol literali, şablon parçası, `path:`
// alanındaki iç segment (alt rota) ve şablondaki statik öznitelik (`to="/admin"`) denetlenir.
const routeMessage =
  'Rol önekli rota yasak (K10): URL özelliğe göredir (/gorevler), /admin|/koordinator|/uye öneki yok.'
const ROLE_SEGMENT = '(admin|yonetici|koordinator|uye|coordinator|member)'
const routePrefixSyntax = [
  { selector: `Literal[value=/^\\/${ROLE_SEGMENT}(\\/|$)/i]`, message: routeMessage },
  {
    selector: `TemplateElement[value.cooked=/^\\/${ROLE_SEGMENT}(\\/|$)/i]`,
    message: routeMessage,
  },
  {
    selector: `Property[key.name='path'] > Literal.value[value=/(^|\\/)${ROLE_SEGMENT}(\\/|$)/i]`,
    message: routeMessage,
  },
]
const routePrefixTemplateSyntax = [
  { selector: `VLiteral[value=/^\\/${ROLE_SEGMENT}(\\/|$)/i]`, message: routeMessage },
]

// --- designStub (K13) ------------------------------------------------------------------------
// tests/lint/design-stub.test.ts kimlikleri kaynaktan statik okur; bu yüzden kimlik dize literali
// olmalı ve fonksiyon takma adla/ad alanıyla çağrılmamalı.
const stubMessage =
  "designStub('BE-NNN', değer): kimlik dize literali olmalı, takma ad / ad alanı içe aktarımı yok (K13)."
const designStubSyntax = [
  {
    selector: "CallExpression[callee.name='designStub']:not([arguments.0.value=/^BE-\\d{3}$/])",
    message: stubMessage,
  },
  {
    selector: "ImportSpecifier[imported.name='designStub'][local.name!='designStub']",
    message: stubMessage,
  },
  {
    selector: 'ImportDeclaration[source.value=/design-stub/] > ImportNamespaceSpecifier',
    message: stubMessage,
  },
]

const routeSyntax = [...routePrefixSyntax, ...routePrefixTemplateSyntax]

/**
 * Seçici yasağı kuralı (`no-restricted-syntax` ile aynı biçim, ayrı kural kimliği). K1/K10/K13
 * yasakları ayrı kimlikte durur ki dosya başı `no-restricted-syntax` istisnaları (ör. depolama
 * bağdaştırıcısı) onları ezmesin. `.vue` dosyasında şablon ifadeleri de aynı seçicilerle gezilir.
 */
function selectorBanRule(description) {
  return {
    meta: {
      type: 'problem',
      docs: { description },
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: { selector: { type: 'string' }, message: { type: 'string' } },
          required: ['selector', 'message'],
          additionalProperties: false,
        },
      },
    },
    create(context) {
      const visitor = Object.fromEntries(
        context.options.map(({ selector, message }) => [
          selector,
          (node) => context.report({ node, message }),
        ]),
      )
      const services = context.sourceCode.parserServices
      if (services?.defineTemplateBodyVisitor) {
        return services.defineTemplateBodyVisitor(visitor, visitor)
      }
      return visitor
    },
  }
}

// --- Boyut kapıları (K12) --------------------------------------------------------------------
// Başlangıç değerleri F0–F1'de ölçülüp kalibre edilir (yol haritası K12). `pnpm lint`
// `--max-warnings=0` ile koştuğu için 250 uyarısı da kapıyı kırar; aşmak isteyen dosya
// aşağıdaki listeye YAZILI GEREKÇEYLE girer (uyarı kalkar, 400 hata kalır). Satır içi
// `eslint-disable` yoktur.
export const SIZE_LIMITS = { vueWarn: 250, vueError: 400, functionLines: 60, complexity: 12 }
/** @type {Record<string, string>} dosya yolu → gerekçe */
export const vueSizeExceptions = {}
/**
 * Fonksiyon boyutu/karmaşıklık istisnaları: dosya → { tavan, gerekçe }. Tavan ölçülen değerdir
 * (büyüme yine kırmızı). Kalibrasyon (K12, ilk ölçüm 2026-11-08, WEB-1a kodu):
 * 60 satır / 12 karmaşıklığı yalnız aşağıdaki üç işlev aşıyor; eşik bu yüzden düşürülmedi/yükseltilmedi.
 * @type {Record<string, { functionLines?: number, complexity?: number, reason: string }>}
 */
export const functionSizeExceptions = {
  'src/shared/http/client.ts': {
    functionLines: 62,
    reason:
      'createApiClient: ara katman zinciri (kapsam, CSRF, Bearer, 401 tek uçuş) aynı kapanışı paylaşır; bölme sahibinin işi.',
  },
  'src/shared/session/auth-session.ts': {
    complexity: 13,
    reason:
      '#refreshLocked: Web Locks + BroadcastChannel tek uçuş refresh durum makinesi; dallar refresh-coordination.md ile birebir.',
  },
  'src/shared/session/messages.ts': {
    complexity: 25,
    reason:
      'parseSessionMessage: sekmeler arası mesajın çalışma anı doğrulayıcısı (alan başına typeof dalı); şema doğrulayıcı (K11) gelince sadeleşir.',
  },
}

const fileLineCeiling = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Dosya satır tavanı (max-lines ile aynı sayım; ikinci eşik için).' },
    schema: [{ type: 'integer', minimum: 1 }],
    messages: { tooLong: 'Dosya {{actual}} satır; tavan {{max}} (K12). Bileşeni bölün.' },
  },
  create(context) {
    const max = context.options[0] ?? SIZE_LIMITS.vueError
    return {
      Program() {
        const actual = context.sourceCode.lines.length
        if (actual > max) {
          context.report({
            loc: { line: max + 1, column: 0 },
            messageId: 'tooLong',
            data: { actual, max },
          })
        }
      },
    }
  },
}
const nizamioPlugin = {
  meta: { name: 'nizamio' },
  rules: {
    'dosya-tavani': fileLineCeiling,
    'rol-dizesi': selectorBanRule('Rol dizesi yalnız capability/standing dosyalarında (K1).'),
    'rol-onekli-rota': selectorBanRule('Rol önekli rota yasağı (K10).'),
    'design-stub-cagrisi': selectorBanRule('designStub kimliği statik okunabilir olmalı (K13).'),
  },
}

export default defineConfigWithVueTs(
  {
    name: 'nizamio/ignores',
    ignores: [
      '.backend/**',
      'e2e/.state/**',
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
    // Tek istisna aşağıdaki 'nizamio/depolama-istisnasi' bloğunda (yalnız bu dosya).
    ignores: ['src/shared/preferences/storage-adapter.ts'],
    rules: storageBan,
  },
  {
    // Tek depolama istisnası (yol haritası K2): yalnız bu dosya, yalnız `localStorage`; izinli
    // anahtar listesi `src/shared/preferences/keys.ts`. `sessionStorage` burada da yasak.
    // `no-restricted-syntax` bilinçli olarak KULLANILMAZ: başka bloklardaki seçiciler (ör. rol
    // dizesi kuralı) bu dosyada da aynen geçerli kalır. Kanıt: tests/lint/architecture.test.ts.
    name: 'nizamio/depolama-istisnasi',
    files: ['src/shared/preferences/storage-adapter.ts'],
    rules: {
      'no-restricted-globals': ['error', { name: 'sessionStorage', message: storageMessage }],
      'no-restricted-properties': [
        'error',
        { property: 'sessionStorage', message: storageMessage },
      ],
    },
  },
  {
    name: 'nizamio/elle-dto-yasagi',
    files: ['src/modules/**/api/**/*.{ts,tsx,mts,cts}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...storageBan['no-restricted-syntax'].slice(1),
        // Yerel tip BİLDİRİMİ yok: interface, type alias (her biçim), class, enum, namespace.
        { selector: 'TSInterfaceDeclaration', message: dtoMessage },
        { selector: 'TSTypeAliasDeclaration', message: dtoMessage },
        { selector: 'ClassDeclaration', message: dtoMessage },
        { selector: 'ClassExpression', message: dtoMessage },
        { selector: 'TSEnumDeclaration', message: dtoMessage },
        { selector: 'TSModuleDeclaration', message: dtoMessage },
        // Satır içi tip İNŞASI yok: nesne/tuple/eşlenmiş tip, literal tip, yardımcı tiplerle
        // şekil üretme. Tipler @/shared/api (schema.d.ts) kökenli ADLARLA kullanılır.
        { selector: 'TSTypeLiteral', message: dtoMessage },
        { selector: 'TSTupleType', message: dtoMessage },
        { selector: 'TSMappedType', message: dtoMessage },
        { selector: 'TSLiteralType', message: dtoMessage },
        { selector: 'TSTemplateLiteralType', message: dtoMessage },
        {
          selector:
            'TSTypeReference[typeName.name=/^(Record|Partial|Required|Pick|Omit|Readonly|Exclude|Extract|NonNullable)$/]',
          message: dtoMessage,
        },
      ],
    },
  },
  {
    // K1 / K10 / K13: ayrı kural kimlikleri (no-restricted-syntax istisnaları bunları ezmez).
    name: 'nizamio/mimari-yasaklar',
    files: ['src/**/*.{ts,vue}'],
    plugins: { nizamio: nizamioPlugin },
    rules: {
      'nizamio/rol-dizesi': ['error', ...roleSyntax],
      'nizamio/rol-onekli-rota': ['error', ...routeSyntax],
      'nizamio/design-stub-cagrisi': ['error', ...designStubSyntax],
    },
  },
  {
    name: 'nizamio/rol-izinli-dosyalar',
    files: ROLE_ALLOWED_FILES,
    rules: { 'nizamio/rol-dizesi': 'off' },
  },
  {
    // Test fikstürleri rol dizesi ve yol taşır (sahte /v1/me, yönlendirme denemeleri).
    name: 'nizamio/test-dosyalari',
    files: SRC_TEST_FILES,
    rules: { 'nizamio/rol-dizesi': 'off', 'nizamio/rol-onekli-rota': 'off' },
  },
  {
    name: 'nizamio/boyut-vue',
    files: ['src/**/*.vue'],
    rules: {
      'max-lines': [
        'warn',
        { max: SIZE_LIMITS.vueWarn, skipBlankLines: false, skipComments: false },
      ],
      'nizamio/dosya-tavani': ['error', SIZE_LIMITS.vueError],
    },
  },
  ...(Object.keys(vueSizeExceptions).length > 0
    ? [
        {
          name: 'nizamio/boyut-vue-istisnalari',
          files: Object.keys(vueSizeExceptions),
          rules: { 'max-lines': 'off' },
        },
      ]
    : []),
  {
    name: 'nizamio/fonksiyon-boyutu',
    files: ['src/**/*.{ts,vue}'],
    ignores: SRC_TEST_FILES,
    rules: {
      'max-lines-per-function': [
        'error',
        { max: SIZE_LIMITS.functionLines, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      complexity: ['error', { max: SIZE_LIMITS.complexity }],
    },
  },
  ...Object.entries(functionSizeExceptions).map(([file, limit]) => ({
    name: `nizamio/fonksiyon-boyutu-istisnasi:${file}`,
    files: [file],
    rules: {
      'max-lines-per-function': [
        'error',
        {
          max: limit.functionLines ?? SIZE_LIMITS.functionLines,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
      complexity: ['error', { max: limit.complexity ?? SIZE_LIMITS.complexity }],
    },
  })),
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
