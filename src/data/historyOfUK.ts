import { SectionData } from '../types';

export const historyOfUKSection: SectionData = {
  id: 3,
  title: 'History of the UK',
  icon: '📜',
  color: '#1CB0F6',
  concepts: [
    {
      id: 'stone-age',
      name: 'Stone Age Britain',
      text: 'The first people to live in Britain were hunter-gatherers during the Stone Age. Stonehenge was built during this period.',
      memoryTrigger: 'Stonehenge = Stone Age',
      questions: [
        {
          id: 301,
          question: 'Question 1',
          options: ['W', 'C', 'W', 'W'],
          correctIndex: 1,
          explanation: 'The first people in Britain were hunter-gatherers.',
        },
        {
          id: 302,
          question: 'Question 2',
          options: ['W', 'C', 'W', 'W'],
          correctIndex: 1,
          explanation: 'Stonehenge was built during the Stone Age.',
        },
        {
          id: 303,
          question: 'Question 3',
          options: ['W', 'C'],
          correctIndex: 1,
          explanation: 'Stonehenge was built during the Stone Age, not the Bronze Age.',
        },
      ],
    },
    {
      id: 'roman-britain',
      name: 'Roman Britain',
      text: 'The Romans invaded Britain in AD 43 and ruled for about 400 years. They built roads, walls, and baths.',
      memoryTrigger: 'AD 43, roads & walls',
      questions: [
        {
          id: 304,
          question: 'Question 4',
          options: ['C', 'W', 'W', 'W'],
          correctIndex: 0,
          explanation: 'The Romans invaded Britain in AD 43.',
        },
        {
          id: 305,
          question: 'Question 5',
          options: ['C', 'W', 'W', 'W'],
          correctIndex: 0,
          explanation: 'The Romans built roads, walls and baths across Britain.',
        },
        {
          id: 306,
          question: 'Question 6',
          options: ['W', 'C', 'W', 'W'],
          correctIndex: 1,
          explanation: 'The Romans ruled Britain for about 400 years.',
        },
      ],
    },
    {
      id: 'anglo-saxons',
      name: 'Anglo-Saxons',
      text: 'After the Romans left, the Anglo-Saxons came from northern Europe. They established kingdoms across England.',
      memoryTrigger: 'After Romans, from N. Europe',
      questions: [
        {
          id: 307,
          question: 'Question 7',
          options: ['C', 'W', 'W', 'W'],
          correctIndex: 0,
          explanation: 'The Anglo-Saxons came from northern Europe.',
        },
        {
          id: 308,
          question: 'Question 8',
          options: ['W', 'C', 'W', 'W'],
          correctIndex: 1,
          explanation: 'The Anglo-Saxons arrived after the Romans left Britain.',
        },
        {
          id: 309,
          question: 'Question 9',
          options: ['C', 'W', 'W', 'W'],
          correctIndex: 0,
          explanation: 'The Anglo-Saxons established kingdoms across England.',
        },
      ],
    },
  ],
};
