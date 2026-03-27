export interface Section {
  id: number;
  slug: string;
  title: string;
  icon: string;
  color: string;
  totalQuestions: number;
  completed: number;
}

export const sections: Section[] = [
  {
    id: 1,
    slug: 'what-is-the-uk',
    title: 'What is the UK',
    icon: 'globe-outline',
    color: '#FF9600',
    totalQuestions: 33,
    completed: 0,
  },
  {
    id: 2,
    slug: 'values-and-principles',
    title: 'Values & Principles',
    icon: 'business-outline',
    color: '#FF4B4B',
    totalQuestions: 43,
    completed: 0,
  },
  {
    id: 3,
    slug: 'history-of-the-uk',
    title: 'History of the UK',
    icon: 'time-outline',
    color: '#1CB0F6',
    totalQuestions: 143,
    completed: 0,
  },
  {
    id: 4,
    slug: 'modern-society',
    title: 'Modern Society',
    icon: 'people-outline',
    color: '#1A56DB',
    totalQuestions: 139,
    completed: 0,
  },
  {
    id: 5,
    slug: 'government-and-law',
    title: 'Government & Law',
    icon: 'shield-checkmark-outline',
    color: '#CE82FF',
    totalQuestions: 30,
    completed: 0,
  },
];
