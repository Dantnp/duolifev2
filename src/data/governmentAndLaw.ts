import { SectionData } from '../types';

export const governmentAndLawSection: SectionData = {
  id: 5,
  title: 'Government & Law',
  icon: '⚖️',
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
          question: 'Question 1',
          options: ['W', 'C', 'W', 'W'],
          correctIndex: 1,
          explanation: 'The UK is a constitutional monarchy.',
        },
        {
          id: 502,
          question: 'Question 2',
          options: ['W', 'C', 'W', 'W'],
          correctIndex: 1,
          explanation: 'The King is the head of state in the UK.',
        },
        {
          id: 503,
          question: 'Question 3',
          options: ['W', 'C', 'W', 'W'],
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
          question: 'Question 4',
          options: ['W', 'C', 'W', 'W'],
          correctIndex: 1,
          explanation: 'The Prime Minister is the head of government.',
        },
        {
          id: 505,
          question: 'Question 5',
          options: ['W', 'C', 'W', 'W'],
          correctIndex: 1,
          explanation: 'The Prime Minister\'s official residence is 10 Downing Street.',
        },
        {
          id: 506,
          question: 'Question 6',
          options: ['W', 'C', 'W', 'W'],
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
          question: 'Question 7',
          options: ['W', 'C', 'W', 'W'],
          correctIndex: 1,
          explanation: 'Parliament has two chambers: the Commons and the Lords.',
        },
        {
          id: 508,
          question: 'Question 8',
          options: ['W', 'C'],
          correctIndex: 1,
          explanation: 'Members of the House of Lords are appointed, not elected.',
        },
        {
          id: 509,
          question: 'Question 9',
          options: ['C', 'W', 'W', 'W'],
          correctIndex: 0,
          explanation: 'Both chambers debate and vote on laws.',
        },
      ],
    },
  ],
};
