import { SectionData } from '../types';

export const whatIsUKSection: SectionData = {
  id: 1,
  title: 'What is the UK',
  emoji: '🌍',
  color: '#FF9600',
  concepts: [
    {
      id: 'countries-of-uk',
      name: 'Countries of the UK',
      text: 'The UK is made up of four countries: England, Scotland, Wales and Northern Ireland.',
      memoryTrigger: '4 countries = UK',
      questions: [
        {
          id: 101,
          question: 'Which countries are in the UK?',
          options: [
            'England, Scotland, Wales, Northern Ireland',
            'England, Ireland, Scotland',
            'France, England, Wales',
            'England only',
          ],
          correctIndex: 0,
          explanation: 'The UK has four countries: England, Scotland, Wales and Northern Ireland.',
        },
        {
          id: 102,
          question: 'Is Ireland part of the UK?',
          options: ['Yes', 'No'],
          correctIndex: 1,
          explanation: 'Ireland is a separate country and not part of the UK.',
        },
        {
          id: 103,
          question: 'How many countries are in the UK?',
          options: ['3', '4', '5', '2'],
          correctIndex: 1,
          explanation: 'There are four countries in the UK.',
        },
      ],
    },
    {
      id: 'uk-vs-great-britain',
      name: 'UK vs Great Britain',
      text: 'Great Britain is the island with England, Scotland and Wales. The UK includes Great Britain plus Northern Ireland.',
      memoryTrigger: 'GB = 3, UK = 4',
      questions: [
        {
          id: 104,
          question: 'What is Great Britain?',
          options: ['England, Scotland, Wales', 'UK + Ireland', 'England only', 'Europe'],
          correctIndex: 0,
          explanation: 'Great Britain is the island containing England, Scotland and Wales — it excludes Northern Ireland.',
        },
        {
          id: 105,
          question: 'Does Great Britain include Northern Ireland?',
          options: ['Yes', 'No'],
          correctIndex: 1,
          explanation: 'Northern Ireland is not part of Great Britain.',
        },
        {
          id: 106,
          question: 'What is the full name of the UK?',
          options: [
            'United Britain',
            'United Kingdom of Great Britain and Northern Ireland',
            'Britain Union',
            'Great Kingdom',
          ],
          correctIndex: 1,
          explanation: 'The official full name is the United Kingdom of Great Britain and Northern Ireland.',
        },
      ],
    },
    {
      id: 'british-isles',
      name: 'British Isles',
      text: 'The British Isles is a geographical term for the islands containing the UK and Ireland. It is not a political term.',
      memoryTrigger: 'Geography, not politics',
      questions: [
        {
          id: 107,
          question: 'What is the British Isles?',
          options: ['UK only', 'UK and Ireland', 'Europe', 'England'],
          correctIndex: 1,
          explanation: 'The British Isles is a geographical term covering the UK and Ireland.',
        },
        {
          id: 108,
          question: 'Is the British Isles a political term?',
          options: ['Yes', 'No'],
          correctIndex: 1,
          explanation: 'The British Isles is purely a geographical term, not a political one.',
        },
        {
          id: 109,
          question: 'Does the British Isles include Ireland?',
          options: ['Yes', 'No'],
          correctIndex: 0,
          explanation: 'Yes, the British Isles includes both the UK and Ireland.',
        },
      ],
    },
  ],
};
