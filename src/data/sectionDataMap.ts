import { SectionData } from '../types';
import { whatIsUKSection } from './whatIsUK';
import { valuesAndPrinciplesSection } from './valuesAndPrinciples';
import { historyOfUKSection } from './historyOfUK';
import { modernSocietySection } from './modernSociety';
import { governmentAndLawSection } from './governmentAndLaw';

export const sectionDataMap: Record<number, SectionData> = {
  1: whatIsUKSection,
  2: valuesAndPrinciplesSection,
  3: historyOfUKSection,
  4: modernSocietySection,
  5: governmentAndLawSection,
};
