export type QuestionType = 'single' | 'multiple' | 'boolean';

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  /** For multi-select questions — all indices that are correct */
  correctIndices?: number[];
  /** 'single' (default), 'multiple' (pick several), or 'boolean' (True/False) */
  type?: QuestionType;
  explanation?: string;
}

export interface Concept {
  id: string;
  name: string;
  text: string;
  memoryTrigger: string;
  questions: Question[];
}

export interface SectionData {
  id: number;
  title: string;
  icon: string;
  color: string;
  concepts: Concept[];
}

export type RootStackParamList = {
  Home: undefined;
  SectionMap: { sectionId: number };
  SectionQuiz: { sectionId: number; conceptIndex: number };
  Quiz: { questions?: Question[] };
  Results: { score: number; total: number };
  MockExam: { examId: number };
};
