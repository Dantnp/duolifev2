import { Question } from '../types';

export const questions: Question[] = [
  {
    id: 1,
    question: 'How many countries make up the United Kingdom?',
    options: ['Three', 'Five', 'Four', 'Two'],
    correctIndex: 2,
    explanation: 'The UK is made up of four countries: England, Scotland, Wales and Northern Ireland.',
  },
  {
    id: 2,
    question: 'What is the official full name of the UK?',
    options: ['The British Kingdom', 'The Kingdom of England', 'Great Britain', 'The United Kingdom of Great Britain and Northern Ireland'],
    correctIndex: 3,
    explanation: 'The full official name is the United Kingdom of Great Britain and Northern Ireland.',
  },
  {
    id: 3,
    question: 'What type of democracy is the UK?',
    options: ['Direct democracy', 'Parliamentary democracy', 'Presidential democracy', 'Military democracy'],
    correctIndex: 1,
    explanation: 'The UK is a parliamentary democracy where citizens elect MPs.',
  },
  {
    id: 4,
    question: 'Who is the head of state in the UK?',
    options: ['The Prime Minister', 'The King', 'The Speaker', 'The Chancellor'],
    correctIndex: 1,
    explanation: 'The King is the head of state in the UK.',
  },
  {
    id: 5,
    question: 'When did the Romans invade Britain?',
    options: ['500 BC', 'AD 410', 'AD 43', '1066'],
    correctIndex: 2,
    explanation: 'The Romans invaded Britain in AD 43.',
  },
  {
    id: 6,
    question: 'What is the approximate population of the UK?',
    options: ['30 million', '50 million', '67 million', '100 million'],
    correctIndex: 2,
    explanation: 'The UK has a population of about 67 million.',
  },
  {
    id: 7,
    question: 'What is the largest religion in the UK?',
    options: ['Islam', 'Christianity', 'Hinduism', 'Buddhism'],
    correctIndex: 1,
    explanation: 'Christianity is the largest religion in the UK.',
  },
  {
    id: 8,
    question: 'When is Bonfire Night celebrated?',
    options: ['25 December', '1 January', '5 November', '11 November'],
    correctIndex: 2,
    explanation: 'Bonfire Night is celebrated on 5 November.',
  },
  {
    id: 9,
    question: 'How many chambers does Parliament have?',
    options: ['One', 'Three', 'Two', 'Four'],
    correctIndex: 2,
    explanation: 'Parliament has two chambers: the House of Commons and the House of Lords.',
  },
  {
    id: 10,
    question: 'Where is the PM\'s official residence?',
    options: ['Buckingham Palace', '10 Downing Street', 'Windsor Castle', 'Westminster Abbey'],
    correctIndex: 1,
    explanation: 'The Prime Minister\'s official residence is 10 Downing Street.',
  },
];
