import type { MissionSeed } from '../types.js';

export const chapter7Missions: MissionSeed[] = [
  {
    slug: 'chapter-7-mission-1',
    chapterOrder: 7,
    order: 1,
    title: '나눗셈 0 처리',
    description:
      '정수 n을 입력받아 10 // n을 출력해야 하지만 n이 0이면 ZeroDivisionError로 중단됩니다. 0일 때만 error를 출력하도록 예외 처리하세요. 음수는 정상적으로 계산되어야 합니다.',
    difficulty: 4,
    isBoss: false,
    bugTypeSlug: 'exception',
    initialCode: 'n = int(input())\nprint(10 // n)\n',
    referenceSolution:
      'n = int(input())\ntry:\n    print(10 // n)\nexcept ZeroDivisionError:\n    print("error")\n',
    tests: [
      {
        order: 1,
        input: '2\n',
        expectedOutput: '5',
        isHidden: false,
      },
      {
        order: 2,
        input: '5\n',
        expectedOutput: '2',
        isHidden: false,
      },
      {
        order: 3,
        input: '0\n',
        expectedOutput: 'error',
        isHidden: true,
      },
      {
        order: 4,
        input: '-2\n',
        expectedOutput: '-5',
        isHidden: true,
      },
      {
        order: 5,
        input: '1\n',
        expectedOutput: '10',
        isHidden: true,
      },
    ],
    hints: [
      '0으로 나눌 때 Python이 내는 예외 이름을 확인하세요.',
      '`ZeroDivisionError`를 처리해야 합니다.',
      '`try`/`except ZeroDivisionError`로 감싸세요.',
    ],
    explanation:
      '0으로 나누면 ZeroDivisionError가 발생합니다. try/except로 처리해야 프로그램이 중단되지 않습니다.',
    concepts: ['try', 'except', 'ZeroDivisionError'],
    baseXp: 120,
  },
  {
    slug: 'chapter-7-mission-2',
    chapterOrder: 7,
    order: 2,
    title: '숫자 변환 실패 처리',
    description:
      '입력받은 문자열을 정수로 바꿔 두 배를 출력해야 하지만 숫자가 아니면 ValueError로 중단됩니다. 숫자가 아닐 때만 not a number를 출력하도록 예외 처리하세요. 음수와 앞뒤 공백은 정상 처리되어야 합니다.',
    difficulty: 5,
    isBoss: false,
    bugTypeSlug: 'exception',
    initialCode: 'data = input().strip()\nresult = int(data) * 2\nprint(result)\n',
    referenceSolution:
      'data = input().strip()\ntry:\n    result = int(data) * 2\n    print(result)\nexcept ValueError:\n    print("not a number")\n',
    tests: [
      {
        order: 1,
        input: 'abc\n',
        expectedOutput: 'not a number',
        isHidden: false,
      },
      {
        order: 2,
        input: '4\n',
        expectedOutput: '8',
        isHidden: false,
      },
      {
        order: 3,
        input: '3.5\n',
        expectedOutput: 'not a number',
        isHidden: true,
      },
      {
        order: 4,
        input: '-12\n',
        expectedOutput: '-24',
        isHidden: true,
      },
      {
        order: 5,
        input: '0\n',
        expectedOutput: '0',
        isHidden: true,
      },
    ],
    hints: [
      '`int("abc")`는 ValueError를 발생시킵니다.',
      '`try`/`except ValueError`로 처리하세요.',
      '변환 실패 시 "not a number"를 출력하세요.',
    ],
    explanation:
      'int()는 숫자로 변환할 수 없는 문자열에서 ValueError를 발생시킵니다. try/except로 처리해야 합니다.',
    concepts: ['try', 'except', 'ValueError'],
    baseXp: 140,
  },
  {
    slug: 'chapter-7-mission-3',
    chapterOrder: 7,
    order: 3,
    title: '없는 파일 읽기',
    description:
      '입력받은 경로의 파일을 읽어 출력해야 하지만 파일이 없으면 FileNotFoundError로 중단됩니다. 없을 때만 missing을 출력하도록 예외 처리하세요. with 문은 유지해야 합니다.',
    difficulty: 5,
    isBoss: false,
    bugTypeSlug: 'exception',
    initialCode:
      'filename = input().strip()\nwith open(filename) as f:\n    content = f.read()\nprint(content)\n',
    referenceSolution:
      'filename = input().strip()\ntry:\n    with open(filename) as f:\n        content = f.read()\n    print(content)\nexcept FileNotFoundError:\n    print("missing")\n',
    tests: [
      {
        order: 1,
        input: 'data.txt\n',
        expectedOutput: 'missing',
        isHidden: false,
      },
      {
        order: 2,
        input: 'missing.json\n',
        expectedOutput: 'missing',
        isHidden: false,
      },
      {
        order: 3,
        input: 'notes.csv\n',
        expectedOutput: 'missing',
        isHidden: true,
      },
      {
        order: 4,
        input: 'nested/ghost.txt\n',
        expectedOutput: 'missing',
        isHidden: true,
      },
      {
        order: 5,
        input: '.not-found\n',
        expectedOutput: 'missing',
        isHidden: true,
      },
    ],
    hints: [
      '파일이 없으면 FileNotFoundError가 발생합니다.',
      '`try`/`except FileNotFoundError`로 처리하세요.',
      '파일 없음 시 "missing"을 출력하세요.',
    ],
    explanation:
      '존재하지 않는 파일을 열면 FileNotFoundError가 발생합니다. try/except로 처리해야 합니다.',
    concepts: ['try', 'except', 'FileNotFoundError'],
    baseXp: 140,
  },
  {
    slug: 'chapter-7-mission-4',
    chapterOrder: 7,
    order: 4,
    title: '세 예외 한 번에 처리',
    description:
      '공백으로 구분된 두 정수를 입력받아 나눗셈을 해야 하지만 입력 부족, 숫자 아님, 0 나눗셈에 중단됩니다. 세 경우 모두 invalid input을 출력하도록 예외를 묶어 처리하세요. 정상적인 음수 연산은 그대로 통과해야 합니다.',
    difficulty: 5,
    isBoss: false,
    bugTypeSlug: 'exception',
    initialCode:
      'data = input().split()\nfirst = int(data[0])\nsecond = int(data[1])\nprint(first // second)\n',
    referenceSolution:
      'data = input().split()\ntry:\n    first = int(data[0])\n    second = int(data[1])\n    print(first // second)\nexcept (IndexError, ZeroDivisionError, ValueError):\n    print("invalid input")\n',
    tests: [
      {
        order: 1,
        input: '10 2\n',
        expectedOutput: '5',
        isHidden: false,
      },
      {
        order: 2,
        input: '5 0\n',
        expectedOutput: 'invalid input',
        isHidden: false,
      },
      {
        order: 3,
        input: 'abc\n',
        expectedOutput: 'invalid input',
        isHidden: true,
      },
      {
        order: 4,
        input: '9 x\n',
        expectedOutput: 'invalid input',
        isHidden: true,
      },
      {
        order: 5,
        input: '-9 2\n',
        expectedOutput: '-5',
        isHidden: true,
      },
    ],
    hints: [
      '입력이 부족하면 IndexError가 발생합니다.',
      '0으로 나누면 ZeroDivisionError가 발생합니다.',
      '여러 예외를 `except (A, B, C)`로 한 번에 처리할 수 있습니다.',
    ],
    explanation: '여러 종류의 오류가 발생할 수 있으므로 복합 except로 처리해야 합니다.',
    concepts: ['try', 'except', '복합 예외'],
    baseXp: 140,
  },
  {
    slug: 'chapter-7-mission-5',
    chapterOrder: 7,
    order: 5,
    title: '빈 데이터 보고서',
    description:
      'n개의 정수를 읽어 합계·평균·최댓값을 출력해야 하지만 n=0이면 빈 리스트 계산에 ZeroDivisionError와 ValueError로 중단됩니다. n=0일 때만 no data 한 줄을 출력하도록 먼저 처리하세요. 정상 경로의 출력 순서와 평균 형식은 바꾸면 안 됩니다.',
    difficulty: 5,
    isBoss: true,
    bugTypeSlug: 'exception',
    initialCode:
      'n = int(input())\nnums = []\nfor i in range(n):\n    nums.append(int(input()))\navg = sum(nums) / len(nums)\nprint("sum=" + str(sum(nums)))\nprint("avg=" + str(avg))\nprint("max=" + str(max(nums)))\n',
    referenceSolution:
      'n = int(input())\nnums = []\nfor i in range(n):\n    nums.append(int(input()))\nif n == 0:\n    print("no data")\nelse:\n    avg = sum(nums) / len(nums)\n    print("sum=" + str(sum(nums)))\n    print("avg=" + str(avg))\n    print("max=" + str(max(nums)))\n',
    tests: [
      {
        order: 1,
        input: '3\n1\n2\n3\n',
        expectedOutput: 'sum=6\navg=2.0\nmax=3',
        isHidden: false,
      },
      {
        order: 2,
        input: '0\n',
        expectedOutput: 'no data',
        isHidden: false,
      },
      {
        order: 3,
        input: '1\n5\n',
        expectedOutput: 'sum=5\navg=5.0\nmax=5',
        isHidden: true,
      },
      {
        order: 4,
        input: '4\n-3\n0\n8\n-1\n',
        expectedOutput: 'sum=4\navg=1.0\nmax=8',
        isHidden: true,
      },
      {
        order: 5,
        input: '00\n',
        expectedOutput: 'no data',
        isHidden: true,
      },
    ],
    hints: [
      '입력이 0이면 리스트가 비어 있습니다.',
      '빈 리스트에서 `max()`와 나눗셈이 실패합니다.',
      '`n == 0`일 때 "no data"를 출력하세요.',
    ],
    explanation:
      '입력이 0이면 리스트가 비어있어 ZeroDivisionError와 ValueError가 발생합니다. 먼저 빈 입력을 처리해야 합니다.',
    concepts: ['try', 'except', '종합'],
    baseXp: 160,
  },
];
