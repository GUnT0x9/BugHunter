import type { MissionSeed } from '../types.js';

export const chapter3Missions: MissionSeed[] = [
  {
    slug: "chapter-3-mission-1",
    chapterOrder: 3,
    order: 1,
    title: "0 이상 판별",
    description: "0을 `no` 로 잘못 판정합니다. `x > 0` 은 0을 포함하지 않아 `>= 0` 이 필요합니다. 0 이상이면 `yes`, 그 외 `no` 가 출력되도록 수정하세요. 입력: 정수 한 줄.",
    difficulty: 2,
    isBoss: false,
    bugTypeSlug: "logic",
    initialCode: "x = int(input())\nif x > 0:\n    print(\"yes\")\nelse:\n    print(\"no\")\n",
    referenceSolution: "x = int(input())\nif x >= 0:\n    print(\"yes\")\nelse:\n    print(\"no\")\n",
    tests: [
        {
            "order": 1,
            "input": "0\n",
            "expectedOutput": "yes",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "-1\n",
            "expectedOutput": "no",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "5\n",
            "expectedOutput": "yes",
            "isHidden": true
        }
    ],
    hints: ["0일 때 현재 조건의 결과를 확인해보세요.","`x > 0`은 0을 포함하지 않습니다.","`>=`를 사용해 경계값을 포함하세요."],
    explanation: "`>`는 0을 포함하지 않으므로 0일 때 \"no\"가 출력됩니다. `>=`로 바꿔야 0 이상을 포함합니다.",
    concepts: ["if","비교 연산자","경계값"],
    baseXp: 100,
  },
  {
    slug: "chapter-3-mission-2",
    chapterOrder: 3,
    order: 2,
    title: "학점 판정",
    description: "학점 계산기가 여러 학점을 동시에 출력합니다. 독립된 `if` 4개가 겹쳐 85점이면 `B C D` 가 나옵니다. `elif` 체인으로 하나의 학점만 출력되도록 고치세요. 90+ A, 80+ B, 70+ C, 60+ D, 그 외 F.",
    difficulty: 3,
    isBoss: false,
    bugTypeSlug: "logic",
    initialCode: "score = int(input())\nif score >= 90:\n    print(\"A\")\nif score >= 80:\n    print(\"B\")\nif score >= 70:\n    print(\"C\")\nif score >= 60:\n    print(\"D\")\nelse:\n    print(\"F\")\n",
    referenceSolution: "score = int(input())\nif score >= 90:\n    print(\"A\")\nelif score >= 80:\n    print(\"B\")\nelif score >= 70:\n    print(\"C\")\nelif score >= 60:\n    print(\"D\")\nelse:\n    print(\"F\")\n",
    tests: [
        {
            "order": 1,
            "input": "85\n",
            "expectedOutput": "B",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "92\n",
            "expectedOutput": "A",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "55\n",
            "expectedOutput": "F",
            "isHidden": true
        }
    ],
    hints: ["독립적인 `if`를 여러 개 쓰면 조건이 겹칠 때 여러 번 출력됩니다.","85점일 때 어떤 if 블록이 실행되는지 확인해보세요.","`elif`를 사용해 하나의 조건만 실행되게 하세요."],
    explanation: "독립적인 `if`를 사용하면 85점일 때 `>= 80`, `>= 70`, `>= 60` 세 조건이 모두 참이어 세 번 출력됩니다. `elif`로 연결하면 첫 번째 만족하는 조건만 실행됩니다.",
    concepts: ["if","elif","조건 분기"],
    baseXp: 110,
  },
  {
    slug: "chapter-3-mission-3",
    chapterOrder: 3,
    order: 3,
    title: "홀짝 판별",
    description: "홀짝 판별 라벨이 뒤바뀌었습니다. `n % 2 == 0` 일 때 `odd` 를 출력합니다. 짝수면 `even`, 홀수면 `odd` 가 나오도록 문자열을 교환하세요.",
    difficulty: 3,
    isBoss: false,
    bugTypeSlug: "logic",
    initialCode: "n = int(input())\nif n % 2 == 0:\n    print(\"odd\")\nelse:\n    print(\"even\")\n",
    referenceSolution: "n = int(input())\nif n % 2 == 0:\n    print(\"even\")\nelse:\n    print(\"odd\")\n",
    tests: [
        {
            "order": 1,
            "input": "7\n",
            "expectedOutput": "odd",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "4\n",
            "expectedOutput": "even",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "0\n",
            "expectedOutput": "even",
            "isHidden": true
        }
    ],
    hints: ["2로 나눈 나머지가 0이면 짝수입니다.","현재 코드에서 even과 odd가 뒤바뀌어 있습니다.","print 문의 문자열을 바꾸세요."],
    explanation: "2로 나눈 나머지가 0이면 짝수(even)인데, 현재 코드는 \"odd\"를 출력하고 있습니다.",
    concepts: ["if","나머지 연산자","홀짝"],
    baseXp: 110,
  },
  {
    slug: "chapter-3-mission-4",
    chapterOrder: 3,
    order: 4,
    title: "경계 포함",
    description: "범위 판정이 100을 배제합니다. `x < 100` 은 `100` 을 `out` 으로 처리합니다. `1 ≤ x ≤ 100` 이면 `in`, 그 외 `out` 이 되도록 `<= 100` 으로 수정하세요.",
    difficulty: 3,
    isBoss: false,
    bugTypeSlug: "logic",
    initialCode: "x = int(input())\nif x >= 1 and x < 100:\n    print(\"in\")\nelse:\n    print(\"out\")\n",
    referenceSolution: "x = int(input())\nif x >= 1 and x <= 100:\n    print(\"in\")\nelse:\n    print(\"out\")\n",
    tests: [
        {
            "order": 1,
            "input": "100\n",
            "expectedOutput": "in",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "0\n",
            "expectedOutput": "out",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "50\n",
            "expectedOutput": "in",
            "isHidden": true
        }
    ],
    hints: ["100일 때 현재 조건의 결과를 확인해보세요.","`x < 100`은 100을 포함하지 않습니다.","`<=`를 사용해 100을 포함하세요."],
    explanation: "`x < 100`은 100을 포함하지 않으므로 100일 때 \"out\"이 출력됩니다. `<= 100`으로 바꿔야 합니다.",
    concepts: ["if","비교 연산자","경계값"],
    baseXp: 110,
  },
  {
    slug: "chapter-3-mission-5",
    chapterOrder: 3,
    order: 5,
    title: "윤년 판별",
    description: "윤년 판별식이 틀렸습니다. `4 && 100 && 400` 모두 참일 때만 `true` 가 됩니다. 올바른 윤년 규칙 `(4로 나누고 100으로 안 나누거나) 또는 400으로 나누면` 을 구현하세요. 입력: 연도 한 줄.",
    difficulty: 4,
    isBoss: false,
    bugTypeSlug: "logic",
    initialCode: "y = int(input())\nif y % 4 == 0 and y % 100 == 0 and y % 400 == 0:\n    print(\"true\")\nelse:\n    print(\"false\")\n",
    referenceSolution: "y = int(input())\nif (y % 4 == 0 and y % 100 != 0) or (y % 400 == 0):\n    print(\"true\")\nelse:\n    print(\"false\")\n",
    tests: [
        {
            "order": 1,
            "input": "2000\n",
            "expectedOutput": "true",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "1900\n",
            "expectedOutput": "false",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "2024\n",
            "expectedOutput": "true",
            "isHidden": true
        }
    ],
    hints: ["400으로 나누어떨어지면 윤년입니다.","100으로 나누어떨어지면 윤년이 아닙니다 (400 예외).","`(4로 나누어떨어지고 100으로 나누어떨어지지 않거나) 또는 (400으로 나누어떨어지면)` 윤년입니다."],
    explanation: "윤년은 4로 나누어떨어지되 100으로 나누어떨어지지 않거나, 400으로 나누어떨어지는 해입니다. 기존 코드는 세 조건이 모두 참일 때만 true를 출력했습니다.",
    concepts: ["if","논리 연산자","우선순위"],
    baseXp: 120,
  },
  {
    slug: "chapter-3-mission-6",
    chapterOrder: 3,
    order: 6,
    title: "부호 함수",
    description: "부호 함수가 0을 `-1` 로 처리합니다. `>0 / else -1` 만 있어 0 분기가 없습니다. 양수→1, 음수→-1, 0→0 이 되도록 `elif x < 0` 과 `else: 0` 을 추가하세요.",
    difficulty: 4,
    isBoss: false,
    bugTypeSlug: "logic",
    initialCode: "x = int(input())\nif x > 0:\n    print(1)\nelse:\n    print(-1)\n",
    referenceSolution: "x = int(input())\nif x > 0:\n    print(1)\nelif x < 0:\n    print(-1)\nelse:\n    print(0)\n",
    tests: [
        {
            "order": 1,
            "input": "5\n",
            "expectedOutput": "1",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "-3\n",
            "expectedOutput": "-1",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "0\n",
            "expectedOutput": "0",
            "isHidden": true
        }
    ],
    hints: ["0일 때 현재 코드의 출력을 확인해보세요.","0은 양수도 음수도 아닙니다.","`elif x < 0`과 `else: print(0)`을 추가하세요."],
    explanation: "0일 때 현재 코드는 -1을 출력하지만, 0의 부호는 0이어야 합니다. elif와 else로 세 가지 경우를 모두 처리해야 합니다.",
    concepts: ["if","elif","else"],
    baseXp: 120,
  },
  {
    slug: "chapter-3-mission-7",
    chapterOrder: 3,
    order: 7,
    title: "합격 기준",
    description: "합격 판정에 특례가 누락되었습니다. `(80+ && 90+)` 만 있고 `95+` 특례가 없습니다. `(점수≥80 && 출석≥90) 또는 점수≥95` 이면 `pass` 가 되도록 `or` 조건을 추가하세요. 입력: 점수, 출석 두 줄.",
    difficulty: 5,
    isBoss: true,
    bugTypeSlug: "logic",
    initialCode: "score = int(input())\nattend = int(input())\nif score >= 80 and attend >= 90:\n    print(\"pass\")\nelse:\n    print(\"fail\")\n",
    referenceSolution: "score = int(input())\nattend = int(input())\nif (score >= 80 and attend >= 90) or score >= 95:\n    print(\"pass\")\nelse:\n    print(\"fail\")\n",
    tests: [
        {
            "order": 1,
            "input": "88\n85\n",
            "expectedOutput": "fail",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "96\n70\n",
            "expectedOutput": "pass",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "70\n95\n",
            "expectedOutput": "fail",
            "isHidden": true
        }
    ],
    hints: ["88점, 85출석일 때 현재 조건을 계산해보세요.","95점 이상이면 출석율과 관계없이 합격입니다.","`or score >= 95`를 조건에 추가하세요."],
    explanation: "합격 기준은 (80점 이상且90% 이상 출석) 또는 95점 이상입니다. 기존 코드는 95점 이상 조건이 빠져 있습니다.",
    concepts: ["if","논리 연산자","복합 조건"],
    baseXp: 140,
  },
];
