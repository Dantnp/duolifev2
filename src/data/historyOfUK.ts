import { SectionData } from '../types';

export const historyOfUKSection: SectionData = {
  id: 3,
  title: 'History of the UK',
  emoji: '📜',
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
          question: 'What were the first people in Britain?',
          options: ['Farmers', 'Hunter-gatherers', 'Soldiers', 'Traders'],
          correctIndex: 1,
          explanation: 'The first people in Britain were hunter-gatherers.',
        },
        {
          id: 302,
          question: 'Which famous monument is from the Stone Age?',
          options: ['Big Ben', 'Stonehenge', 'Tower of London', 'Buckingham Palace'],
          correctIndex: 1,
          explanation: 'Stonehenge was built during the Stone Age.',
        },
        {
          id: 303,
          question: 'Was Stonehenge built in the Bronze Age?',
          options: ['Yes', 'No'],
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
          question: 'When did the Romans invade Britain?',
          options: ['AD 43', 'AD 100', '500 BC', 'AD 1066'],
          correctIndex: 0,
          explanation: 'The Romans invaded Britain in AD 43.',
        },
        {
          id: 305,
          question: 'What did the Romans build in Britain?',
          options: ['Roads and walls', 'Airports', 'Railways', 'Motorways'],
          correctIndex: 0,
          explanation: 'The Romans built roads, walls and baths across Britain.',
        },
        {
          id: 306,
          question: 'How long did the Romans rule Britain?',
          options: ['About 100 years', 'About 400 years', 'About 50 years', 'About 1000 years'],
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
          question: 'Where did the Anglo-Saxons come from?',
          options: ['Northern Europe', 'Africa', 'Asia', 'South America'],
          correctIndex: 0,
          explanation: 'The Anglo-Saxons came from northern Europe.',
        },
        {
          id: 308,
          question: 'When did the Anglo-Saxons arrive?',
          options: ['Before the Romans', 'After the Romans left', 'During Roman rule', 'In the 1800s'],
          correctIndex: 1,
          explanation: 'The Anglo-Saxons arrived after the Romans left Britain.',
        },
        {
          id: 309,
          question: 'What did the Anglo-Saxons establish?',
          options: ['Kingdoms', 'Republics', 'Colonies', 'Empires'],
          correctIndex: 0,
          explanation: 'The Anglo-Saxons established kingdoms across England.',
        },
      ],
    },
  ],
};
