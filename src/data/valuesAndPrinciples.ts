import { SectionData } from '../types';

export const valuesAndPrinciplesSection: SectionData = {
  id: 2,
  title: 'Values & Principles',
  icon: '🏛️',
  color: '#FF4B4B',
  concepts: [
    {
      id: 'democracy',
      name: 'Democracy',
      text: 'The UK is a parliamentary democracy. Citizens elect Members of Parliament (MPs) to represent them in the House of Commons.',
      memoryTrigger: 'People choose MPs',
      questions: [
        {
          id: 201,
          question: 'Question 1',
          options: ['W', 'C', 'W', 'W'],
          correctIndex: 1,
          explanation: 'The UK is a parliamentary democracy where citizens elect MPs.',
        },
        {
          id: 202,
          question: 'Question 2',
          options: ['W', 'C', 'W', 'W'],
          correctIndex: 1,
          explanation: 'Citizens elect Members of Parliament to represent them.',
        },
        {
          id: 203,
          question: 'Question 3',
          options: ['W', 'C', 'W', 'W'],
          correctIndex: 1,
          explanation: 'Elected MPs sit in the House of Commons.',
        },
      ],
    },
    {
      id: 'rule-of-law',
      name: 'Rule of Law',
      text: 'Everyone in the UK must obey the law, including the government. No one is above the law.',
      memoryTrigger: 'Law applies to ALL',
      questions: [
        {
          id: 204,
          question: 'Question 4',
          options: ['C', 'W'],
          correctIndex: 0,
          explanation: 'Everyone, including the government, must obey the law.',
        },
        {
          id: 205,
          question: 'Question 5',
          options: ['W', 'C', 'W', 'W'],
          correctIndex: 1,
          explanation: 'Rule of law means no one is above the law — it applies to everyone equally.',
        },
        {
          id: 206,
          question: 'Question 6',
          options: ['W', 'W', 'C', 'W'],
          correctIndex: 2,
          explanation: 'No one is above the law in the UK.',
        },
      ],
    },
    {
      id: 'individual-liberty',
      name: 'Individual Liberty',
      text: 'People in the UK have the right to freedom of speech, thought, and religion. These are protected by law.',
      memoryTrigger: 'Free speech, thought, religion',
      questions: [
        {
          id: 207,
          question: 'Question 7',
          options: ['C', 'W', 'W', 'W'],
          correctIndex: 0,
          explanation: 'Freedom of speech is a protected right in the UK.',
        },
        {
          id: 208,
          question: 'Question 8',
          options: ['C', 'W'],
          correctIndex: 0,
          explanation: 'Yes, freedom of religion is a protected right.',
        },
        {
          id: 209,
          question: 'Question 9',
          options: ['C', 'W', 'W', 'W'],
          correctIndex: 0,
          explanation: 'Individual liberties are protected by law in the UK.',
        },
      ],
    },
  ],
};
