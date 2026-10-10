export interface PYQReference {
  exam: string;          // e.g. "GATE CSE"
  year: number | null;
  set?: number;
  qno?: number;
  officialAnswer?: string;
  source?: string;
  verified: boolean;     // FLAG-1 & FLAG-5: unverified badge if false
  notes?: string;
}

export interface QuestionDistractor {
  value: number | string;
  diagnosis: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  diagnosis?: string;
}

export interface Question {
  id: string;
  topicId: 'page-replacement' | 'banker' | 'rag' | 'paging' | 'sync' | 'vm';
  topicName: string;
  archetype: string;
  title: string;
  stem: string;
  type: 'NAT' | 'MCQ' | 'SEQUENCE';
  difficulty: 1 | 2 | 3;
  params?: Record<string, any>;
  answer: number | string | string[];
  tolerance?: number;
  unit?: string;
  options?: QuestionOption[];
  distractors: QuestionDistractor[];
  hintLadder: [string, string, string, string]; // [Method name, First steps, Full trace explanation, Concept link]
  simulatorLink: string;
  pyq: PYQReference[];
  tags: string[];
}

export interface AnswerDiagnosisResult {
  isCorrect: boolean;
  score: number;
  submittedAnswer: string;
  correctAnswerFormatted: string;
  diagnosisText?: string;
  diffSummary?: string;
  suggestedSimLink: string;
}
