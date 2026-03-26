import { SectionData } from '../types';

export const modernSocietySection: SectionData = {
  id: 4,
  title: 'Modern Society',
  icon: '🏙️',
  color: '#1A56DB',
  concepts: [
    {
      id: 'population',
      name: 'UK Population',
      text: 'The UK has a population of about 67 million. England is the most populated country within the UK.',
      memoryTrigger: '67 million, England biggest',
      questions: [
        {
          id: 401,
          question: 'Question 1',
          options: ['W', 'W', 'C', 'W'],
          correctIndex: 2,
          explanation: 'The UK has a population of about 67 million.',
        },
        {
          id: 402,
          question: 'Question 2',
          options: ['W', 'W', 'C', 'W'],
          correctIndex: 2,
          explanation: 'England is the most populated country in the UK.',
        },
        {
          id: 403,
          question: 'Question 3',
          options: ['W', 'C'],
          correctIndex: 1,
          explanation: 'No, the UK has about 67 million people.',
        },
      ],
    },
    {
      id: 'religion',
      name: 'Religion in the UK',
      text: 'The UK is a multi-faith society. Christianity is the largest religion, but people are free to practice any faith or none.',
      memoryTrigger: 'Multi-faith, Christianity largest',
      questions: [
        {
          id: 404,
          question: 'Question 4',
          options: ['W', 'C', 'W', 'W'],
          correctIndex: 1,
          explanation: 'Christianity is the largest religion in the UK.',
        },
        {
          id: 405,
          question: 'Question 5',
          options: ['C', 'W'],
          correctIndex: 0,
          explanation: 'Yes, the UK is a multi-faith society.',
        },
        {
          id: 406,
          question: 'Question 6',
          options: ['C', 'W'],
          correctIndex: 0,
          explanation: 'People are free to practice any faith or none at all.',
        },
      ],
    },
    {
      id: 'customs-traditions',
      name: 'Customs & Traditions',
      text: 'The UK has many traditions including Christmas, Easter, Bonfire Night (5 November), and Remembrance Day (11 November).',
      memoryTrigger: 'Christmas, Bonfire Night, Remembrance',
      questions: [
        {
          id: 407,
          question: 'Question 7',
          options: ['C', 'W', 'W', 'W'],
          correctIndex: 0,
          explanation: 'Bonfire Night is celebrated on 5 November.',
        },
        {
          id: 408,
          question: 'Question 8',
          options: ['W', 'C', 'W', 'W'],
          correctIndex: 1,
          explanation: 'Remembrance Day is on 11 November.',
        },
        {
          id: 409,
          question: 'Question 9',
          options: ['C', 'W'],
          correctIndex: 0,
          explanation: 'Yes, Christmas is one of the UK\'s most important traditions.',
        },
      ],
    },
  ],
};
