import { SectionData } from '../types';

// Lazy-load section data — each file is only required when first accessed
const cache: Record<number, SectionData> = {};

export const sectionDataMap: Record<number, SectionData> = Object.defineProperties(
  {} as Record<number, SectionData>,
  {
    1: { get: () => (cache[1] ??= require('./whatIsUK').whatIsUKSection), enumerable: true },
    2: { get: () => (cache[2] ??= require('./valuesAndPrinciples').valuesAndPrinciplesSection), enumerable: true },
    3: { get: () => (cache[3] ??= require('./historyOfUK').historyOfUKSection), enumerable: true },
    4: { get: () => (cache[4] ??= require('./modernSociety').modernSocietySection), enumerable: true },
    5: { get: () => (cache[5] ??= require('./governmentAndLaw').governmentAndLawSection), enumerable: true },
  },
);
