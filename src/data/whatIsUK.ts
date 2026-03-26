import { SectionData } from '../types';

export const whatIsUKSection: SectionData = {
  id: 1,
  title: 'What is the UK',
  icon: '🌍',
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
          question: 'Question 1',
          options: ['C', 'W', 'W', 'W'],
          correctIndex: 0,
          explanation: 'The UK has four countries: England, Scotland, Wales and Northern Ireland.',
        },
        {
          id: 102,
          question: 'Question 2',
          options: ['W', 'C'],
          correctIndex: 1,
          explanation: 'Ireland is a separate country and not part of the UK.',
        },
        {
          id: 103,
          question: 'Question 3',
          options: ['W', 'C', 'W', 'W'],
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
          question: 'Question 4',
          options: ['C', 'W', 'W', 'W'],
          correctIndex: 0,
          explanation: 'Great Britain is the island containing England, Scotland and Wales — it excludes Northern Ireland.',
        },
        {
          id: 105,
          question: 'Question 5',
          options: ['W', 'C'],
          correctIndex: 1,
          explanation: 'Northern Ireland is not part of Great Britain.',
        },
        {
          id: 106,
          question: 'Question 6',
          options: ['W', 'C', 'W', 'W'],
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
          question: 'Question 7',
          options: ['W', 'C', 'W', 'W'],
          correctIndex: 1,
          explanation: 'The British Isles is a geographical term covering the UK and Ireland.',
        },
        {
          id: 108,
          question: 'Question 8',
          options: ['W', 'C'],
          correctIndex: 1,
          explanation: 'The British Isles is purely a geographical term, not a political one.',
        },
        {
          id: 109,
          question: 'Question 9',
          options: ['C', 'W'],
          correctIndex: 0,
          explanation: 'Yes, the British Isles includes both the UK and Ireland.',
        },
      ],
    },
  ],
};
