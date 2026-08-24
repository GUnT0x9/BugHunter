import type { BugTypeSeed } from './types.js';

export const bugTypes: BugTypeSeed[] = [
  {
    slug: 'syntax',
    name: 'Syntax Bug',
    description: 'Python 문법 규칙을 지키지 않아 실행 전에 멈추는 오류입니다.',
  },
  {
    slug: 'type',
    name: 'Type Bug',
    description: '서로 맞지 않는 자료형을 연산에 사용한 오류입니다.',
  },
  {
    slug: 'logic',
    name: 'Logic Bug',
    description: '실행은 되지만 의도와 다른 결과를 만드는 오류입니다.',
  },
  { slug: 'loop', name: 'Loop Bug', description: '반복 횟수·조건·증감이 잘못되어 한 번 더/덜 돌거나 무한루프가 되는 오류입니다.' },
  {
    slug: 'index',
    name: 'Index Bug',
    description: '리스트나 문자열의 범위를 벗어난 위치를 읽는 오류입니다.',
  },
  {
    slug: 'function',
    name: 'Function Bug',
    description: '함수의 입력, 반환값, 호출 방식이 맞지 않는 오류입니다.',
  },
  {
    slug: 'exception',
    name: 'Exception Bug',
    description: '예외가 발생할 수 있는 상황을 올바르게 처리하지 못한 오류입니다.',
  },
];
