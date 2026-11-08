// Pilot (W31) kök kalite kapılarının dışındadır: ana uygulamaya birleşmez, yalnız
// karşılaştırma kanıtıdır (docs/architecture/gantt-secimi.md). ESLint 10 yapılandırmayı
// dosyanın en yakın dizininden aradığı için kök `eslint .` bu dizinde bu dosyayı kullanır.
export default [{ ignores: ['**/*'] }]
