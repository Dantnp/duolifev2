import { SectionData } from '../types';

export const governmentAndLawSection: SectionData = {
  id: 5,
  title: 'Government & Law',
  emoji: '⚖️',
  color: '#CE82FF',
  concepts: [
    {
      id: 'the-monarchy',
      name: 'The Monarchy',
      text: 'The UK is a constitutional monarchy. The King is the head of state but has a ceremonial role. Real power lies with Parliament.',
      memoryTrigger: 'King = ceremonial, Parliament = power',
      questions: [
        {
          id: 501,
          question: 'What type of monarchy is the UK?',
          options: ['Absolute monarchy', 'Constitutional monarchy', 'Elected monarchy', 'Military monarchy'],
          correctIndex: 1,
          explanation: 'The UK is a constitutional monarchy.',
        },
        {
          id: 502,
          question: 'Who is the head of state?',
          options: ['The Prime Minister', 'The King', 'The Speaker', 'The Mayor'],
          correctIndex: 1,
          explanation: 'The King is the head of state in the UK.',
        },
        {
          id: 503,
          question: 'Where does real political power lie in the UK?',
          options: ['The monarchy', 'Parliament', 'The army', 'The church'],
          correctIndex: 1,
          explanation: 'Real political power lies with Parliament, not the monarchy.',
        },
      ],
    },
    {
      id: 'the-prime-minister',
      name: 'The Prime Minister',
      text: 'The Prime Minister is the head of government and leads the political party with the most seats in the House of Commons.',
      memoryTrigger: 'PM = head of government',
      questions: [
        {
          id: 504,
          question: 'Who is the head of government in the UK?',
          options: ['The King', 'The Prime Minister', 'The Speaker', 'The President'],
          correctIndex: 1,
          explanation: 'The Prime Minister is the head of government.',
        },
        {
          id: 505,
          question: 'Where does the Prime Minister live?',
          options: ['Buckingham Palace', '10 Downing Street', 'Windsor Castle', 'The Tower of London'],
          correctIndex: 1,
          explanation: 'The Prime Minister\'s official residence is 10 Downing Street.',
        },
        {
          id: 506,
          question: 'How does someone become Prime Minister?',
          options: ['Appointed by the King alone', 'Leads the party with most seats in Commons', 'Elected directly by the public', 'Chosen by the House of Lords'],
          correctIndex: 1,
          explanation: 'The PM leads the political party with the most seats in the House of Commons.',
        },
      ],
    },
    {
      id: 'houses-of-parliament',
      name: 'Houses of Parliament',
      text: 'Parliament has two chambers: the House of Commons (elected MPs) and the House of Lords (appointed members). Both debate and vote on laws.',
      memoryTrigger: 'Commons = elected, Lords = appointed',
      questions: [
        {
          id: 507,
          question: 'How many chambers does Parliament have?',
          options: ['1', '2', '3', '4'],
          correctIndex: 1,
          explanation: 'Parliament has two chambers: the Commons and the Lords.',
        },
        {
          id: 508,
          question: 'Are members of the House of Lords elected?',
          options: ['Yes', 'No'],
          correctIndex: 1,
          explanation: 'Members of the House of Lords are appointed, not elected.',
        },
        {
          id: 509,
          question: 'What do both Houses do?',
          options: ['Debate and vote on laws', 'Run schools', 'Command the army', 'Collect taxes'],
          correctIndex: 0,
          explanation: 'Both chambers debate and vote on laws.',
        },
      ],
    },
  ],
};
