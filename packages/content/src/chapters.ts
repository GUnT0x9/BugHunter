import type { ChapterSeed } from './types.js';
export const chapters: ChapterSeed[] = [
  {
    order: 1,
    slug: 'print-basics',
    title: '출력과 기본 문법',
    description: 'print, 따옴표, 괄호, 이스케이프 등 Python 프로그램의 가장 기초적인 출력 문법을 디버깅합니다.',
  },
  {
    order: 2,
    slug: 'variables-types',
    title: '변수와 자료형',
    description: 'input()의 문자열 반환, int 변환, / vs //, 문자열 곱 등 자료형 변환 함정을 다룹니다.',
  },
  {
    order: 3,
    slug: 'conditions',
    title: '조건문',
    description: '비교 연산자, elif 체인, 논리 연산자 우선순위, 경계값 포함 여부를 점검합니다.',
  },
  {
    order: 4,
    slug: 'loops',
    title: '반복문',
    description: 'range 경계, 누적기 초기값, while 증감 누락, 역방향 반복 등 반복문 핵심 패턴을 디버깅합니다.',
  },
  {
    order: 5,
    slug: 'functions',
    title: '함수',
    description: 'return 누락, 인자 순서, 재귀 종료 조건, 슬라이싱 등 함수 작성의 전형적 실수를 잡습니다.',
  },
  {
    order: 6,
    slug: 'collections',
    title: '리스트와 딕셔너리',
    description: '인덱스 범위, 정렬·뒤집기 반환값, set 순서, 병합 후 잔여 처리, 딕셔너리 최댓값 키 등 컬렉션 함정을 다룹니다.',
  },
  {
    order: 7,
    slug: 'exceptions',
    title: '예외 처리와 종합 디버깅',
    description: 'ZeroDivisionError, ValueError, FileNotFoundError 등 예외를 try/except로 안전하게 처리하고, 빈 입력·복합 예외를 종합 디버깅합니다.',
  },
];
