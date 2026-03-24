import { SectionData } from '../types';

export const valuesAndPrinciplesSection: SectionData = {
  id: 2,
  title: 'Values & Principles',
  emoji: '🏛️',
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
          question: 'What type of democracy is the UK?',
          options: ['Direct democracy', 'Parliamentary democracy', 'Presidential democracy', 'Military democracy'],
          correctIndex: 1,
          explanation: 'The UK is a parliamentary democracy where citizens elect MPs.',
        },
        {
          id: 202,
          question: 'Who do citizens elect in the UK?',
          options: ['The King', 'Members of Parliament', 'Judges', 'Police officers'],
          correctIndex: 1,
          explanation: 'Citizens elect Members of Parliament to represent them.',
        },
        {
          id: 203,
          question: 'Where do MPs sit?',
          options: ['House of Lords', 'House of Commons', 'Buckingham Palace', 'Downing Street'],
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
          question: 'Does the government have to obey the law?',
          options: ['Yes', 'No'],
          correctIndex: 0,
          explanation: 'Everyone, including the government, must obey the law.',
        },
        {
          id: 205,
          question: 'What does "rule of law" mean?',
          options: ['The king makes all rules', 'No one is above the law', 'Only citizens follow rules', 'Laws change daily'],
          correctIndex: 1,
          explanation: 'Rule of law means no one is above the law — it applies to everyone equally.',
        },
        {
          id: 206,
          question: 'Is anyone above the law in the UK?',
          options: ['Yes, the Prime Minister', 'Yes, the King', 'No one', 'Yes, judges'],
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
          question: 'Which freedom is protected in the UK?',
          options: ['Freedom of speech', 'Freedom to break laws', 'Freedom from taxes', 'Freedom from work'],
          correctIndex: 0,
          explanation: 'Freedom of speech is a protected right in the UK.',
        },
        {
          id: 208,
          question: 'Is freedom of religion protected in the UK?',
          options: ['Yes', 'No'],
          correctIndex: 0,
          explanation: 'Yes, freedom of religion is a protected right.',
        },
        {
          id: 209,
          question: 'What protects individual liberties?',
          options: ['The law', 'Social media', 'Newspapers', 'Nothing'],
          correctIndex: 0,
          explanation: 'Individual liberties are protected by law in the UK.',
        },
      ],
    },
  ],
};
