import type { MissionSeed } from '../types.js';

export const chapter2Missions: MissionSeed[] = [
  {
    slug: 'chapter-2-mission-1',
    chapterOrder: 2,
    order: 1,
    title: '문자열 덧셈 오류',
    description:
      '두 수를 입력받아 더하는 계산기가 문자열 연결을 합니다. `input()` 은 항상 문자열을 반환하므로 `a + b` 가 `35` 대신 `3+5` 처럼 이어집니다. 두 입력을 `int()` 로 변환해 숫자 덧셈이 되도록 고치세요. 입력: 정수 두 줄, 출력: 합계 한 줄.',
    difficulty: 2,
    isBoss: false,
    bugTypeSlug: 'type',
    initialCode: 'a = input().strip()\nb = input().strip()\nprint(a + b)\n',
    referenceSolution: 'a = int(input().strip())\nb = int(input().strip())\nprint(a + b)\n',
    tests: [
      {
        order: 1,
        input: '3\n5\n',
        expectedOutput: '8',
        isHidden: false,
      },
      {
        order: 2,
        input: '10\n20\n',
        expectedOutput: '30',
        isHidden: false,
      },
      {
        order: 3,
        input: '0\n0\n',
        expectedOutput: '0',
        isHidden: true,
      },
    ],
    hints: [
      'input()의 반환 값은 항상 문자열입니다.',
      '`int()`로 변환하지 않으면 문자열이 연결됩니다.',
      '`int(input())`으로 숫자로 변환하세요.',
    ],
    explanation:
      'input()은 문자열을 반환하므로 두 값을 더하면 연결됩니다. int()로 변환해야 숫자 덧셈이 됩니다.',
    concepts: ['input()', 'int()', 'TypeError'],
    baseXp: 100,
  },
  {
    slug: 'chapter-2-mission-2',
    chapterOrder: 2,
    order: 2,
    title: '정수 나누기 결과',
    description:
      '나눗셈 계산기가 실수를 반환합니다. `7 / 2` 가 `3.5` 로 나와 정수 몫 `3` 이 필요합니다. 정수 나눗셈 연산자로 수정하세요. 입력: `a` `b` 두 줄, 출력: `a // b` 한 줄.',
    difficulty: 2,
    isBoss: false,
    bugTypeSlug: 'type',
    initialCode: 'a = int(input())\nb = int(input())\nprint(a / b)\n',
    referenceSolution: 'a = int(input())\nb = int(input())\nprint(a // b)\n',
    tests: [
      {
        order: 1,
        input: '7\n2\n',
        expectedOutput: '3',
        isHidden: false,
      },
      {
        order: 2,
        input: '10\n3\n',
        expectedOutput: '3',
        isHidden: false,
      },
      {
        order: 3,
        input: '6\n2\n',
        expectedOutput: '3',
        isHidden: true,
      },
    ],
    hints: [
      '`/`는 항상 실수를 반환합니다.',
      '정수 나눗셈은 `//`를 사용합니다.',
      '`a // b`로 바꾸면 몫만 출력됩니다.',
    ],
    explanation:
      '`/` 연산자는 실수를 반환하므로 `3.5`가 나옵니다. `//`는 몫만 반환하는 정수 나눗셈입니다.',
    concepts: ['나눗셈', '정수 나눗셈', 'floor division'],
    baseXp: 100,
  },
  {
    slug: 'chapter-2-mission-3',
    chapterOrder: 2,
    order: 3,
    title: '문자열 곱셈 함정',
    description:
      '숫자를 두 배 하려다 문자열이 두 번 반복됩니다. `n = input()` 후 `n * 2` 는 `"5"*2 = "55"` 가 됩니다. `int()` 변환 후 곱셈이 되도록 수정하세요. 입력: 정수 한 줄, 출력: `n*2` 한 줄.',
    difficulty: 3,
    isBoss: false,
    bugTypeSlug: 'type',
    initialCode: 'n = input().strip()\nprint(n * 2)\n',
    referenceSolution: 'n = int(input().strip())\nprint(n * 2)\n',
    tests: [
      {
        order: 1,
        input: '5\n',
        expectedOutput: '10',
        isHidden: false,
      },
      {
        order: 2,
        input: '3\n',
        expectedOutput: '6',
        isHidden: false,
      },
      {
        order: 3,
        input: '0\n',
        expectedOutput: '0',
        isHidden: true,
      },
    ],
    hints: [
      'input()은 문자열을 반환합니다.',
      '문자열 `"5"`에 `2`를 곱하면 `"55"`가 됩니다.',
      '`int()`로 변환한 뒤 곱하세요.',
    ],
    explanation:
      'input()이 반환하는 문자열을 곱하면 문자열이 반복됩니다. int()로 변환해야 숫자 곱셈이 됩니다.',
    concepts: ['input()', 'int()', '문자열 곱셈'],
    baseXp: 110,
  },
  {
    slug: 'chapter-2-mission-4',
    chapterOrder: 2,
    order: 4,
    title: '자료형 비교 함정',
    description:
      '입력이 10일 때 `False` 가 나오는 비교 버그입니다. `input()` 의 `"10"`(문자열)과 `10`(정수)은 `==` 로 다릅니다. `int()` 변환 후 비교하도록 수정해 `10` 은 `True`, 그 외 `False` 가 나오게 하세요.',
    difficulty: 3,
    isBoss: false,
    bugTypeSlug: 'type',
    initialCode: 'x = input().strip()\nprint(x == 10)\n',
    referenceSolution: 'x = int(input().strip())\nprint(x == 10)\n',
    tests: [
      {
        order: 1,
        input: '10\n',
        expectedOutput: 'True',
        isHidden: false,
      },
      {
        order: 2,
        input: '5\n',
        expectedOutput: 'False',
        isHidden: false,
      },
      {
        order: 3,
        input: '+10\n',
        expectedOutput: 'True',
        isHidden: true,
      },
    ],
    hints: [
      'input()은 문자열을 반환합니다.',
      '"10"과 10은 자료형이 다릅니다.',
      '`int()`로 변환한 뒤 비교하세요.',
    ],
    explanation:
      'input()이 반환하는 "10"은 문자열이고 10은 정수이므로 `==`로 비교하면 항상 False입니다.',
    concepts: ['input()', 'int()', '동등 비교'],
    baseXp: 110,
  },
  {
    slug: 'chapter-2-mission-5',
    chapterOrder: 2,
    order: 5,
    title: '사각형 면적과 둘레',
    description:
      '사각형 계산기가 면적은 맞고 둘레가 틀립니다. `w, h` 가 문자열이라 `2*(w+h)` 가 `"45"+"45"` 처럼 연결됩니다. 두 입력을 최초에 `int()` 로 변환해 `area` 와 `perimeter` 가 모두 올바르게 계산되도록 고치세요. 입력: `w` `h` 두 줄, 출력: 두 줄 `area=` `perimeter=` .',
    difficulty: 4,
    isBoss: true,
    bugTypeSlug: 'type',
    initialCode:
      'w = input().strip()\nh = input().strip()\narea = int(w) * int(h)\nperimeter = 2 * (w + h)\nprint("area=" + str(area))\nprint("perimeter=" + str(perimeter))\n',
    referenceSolution:
      'w = int(input().strip())\nh = int(input().strip())\narea = w * h\nperimeter = 2 * (w + h)\nprint("area=" + str(area))\nprint("perimeter=" + str(perimeter))\n',
    tests: [
      {
        order: 1,
        input: '4\n5\n',
        expectedOutput: 'area=20\nperimeter=18',
        isHidden: false,
      },
      {
        order: 2,
        input: '3\n3\n',
        expectedOutput: 'area=9\nperimeter=12',
        isHidden: false,
      },
      {
        order: 3,
        input: '10\n2\n',
        expectedOutput: 'area=20\nperimeter=24',
        isHidden: true,
      },
    ],
    hints: [
      'w와 h의 자료형을 확인해보세요. area와 perimeter 중 어떤 계산이 잘못될까요?',
      'area는 int()로 변환했지만 perimeter는 문자열 연결이 됩니다.',
      'w와 h를 모두 int()로 변환하세요.',
    ],
    explanation:
      'area는 int()로 변환했지만 perimeter 계산에서 w와 h가 문자열로 연결됩니다. 둘 다 int()로 변환해야 올바르게 계산됩니다.',
    concepts: ['input()', 'int()', '자료형 변환'],
    baseXp: 130,
  },
];
