import { SectionData } from '../types';

export const modernSocietySection: SectionData = {
  id: 4,
  title: 'Modern Society',
  emoji: '🏙️',
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
          question: 'What is the approximate population of the UK?',
          options: ['30 million', '50 million', '67 million', '100 million'],
          correctIndex: 2,
          explanation: 'The UK has a population of about 67 million.',
        },
        {
          id: 402,
          question: 'Which country in the UK has the largest population?',
          options: ['Scotland', 'Wales', 'England', 'Northern Ireland'],
          correctIndex: 2,
          explanation: 'England is the most populated country in the UK.',
        },
        {
          id: 403,
          question: 'Does the UK have more than 100 million people?',
          options: ['Yes', 'No'],
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
          question: 'What is the largest religion in the UK?',
          options: ['Islam', 'Christianity', 'Hinduism', 'Buddhism'],
          correctIndex: 1,
          explanation: 'Christianity is the largest religion in the UK.',
        },
        {
          id: 405,
          question: 'Is the UK a multi-faith society?',
          options: ['Yes', 'No'],
          correctIndex: 0,
          explanation: 'Yes, the UK is a multi-faith society.',
        },
        {
          id: 406,
          question: 'Can people in the UK choose not to practice any religion?',
          options: ['Yes', 'No'],
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
          question: 'When is Bonfire Night?',
          options: ['5 November', '25 December', '1 January', '14 February'],
          correctIndex: 0,
          explanation: 'Bonfire Night is celebrated on 5 November.',
        },
        {
          id: 408,
          question: 'When is Remembrance Day?',
          options: ['5 November', '11 November', '25 December', '1 January'],
          correctIndex: 1,
          explanation: 'Remembrance Day is on 11 November.',
        },
        {
          id: 409,
          question: 'Is Christmas a UK tradition?',
          options: ['Yes', 'No'],
          correctIndex: 0,
          explanation: 'Yes, Christmas is one of the UK\'s most important traditions.',
        },
      ],
    },
  ],
};
