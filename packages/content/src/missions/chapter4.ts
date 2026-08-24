// noqa: SIZE_OK - data file with 8 missions per chapter, splitting would fragment chapter cohesion
import type { MissionSeed } from '../types.js';

export const chapter4Missions: MissionSeed[] = [
  {
    slug: "chapter-4-mission-1",
    chapterOrder: 4,
    order: 1,
    title: "1부터 N까지 합",
    description: "1부터 N까지 합이 N-1 까지만 더해집니다. `range(1, n)` 은 끝값을 포함하지 않아 5일 때 1~4만 합합니다. `range(1, n+1)` 로 수정해 1~N 합이 나오도록 하세요.",
    difficulty: 3,
    isBoss: false,
    bugTypeSlug: "loop",
    initialCode: "n = int(input())\ntotal = 0\nfor i in range(1, n):\n    total += i\nprint(total)\n",
    referenceSolution: "n = int(input())\ntotal = 0\nfor i in range(1, n + 1):\n    total += i\nprint(total)\n",
    tests: [
        {
            "order": 1,
            "input": "5\n",
            "expectedOutput": "15",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "1\n",
            "expectedOutput": "1",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "10\n",
            "expectedOutput": "55",
            "isHidden": true
        }
    ],
    hints: ["range(1, n)은 n을 포함하지 않습니다.","n=5일 때 range(1, 5)는 1,2,3,4만 반복합니다.","`range(1, n + 1)`로 수정하세요."],
    explanation: "range의 끝값은 포함되지 않으므로 n까지 합하려면 `range(1, n+1)`이 필요합니다.",
    concepts: ["range()","누적 변수","Off-by-one"],
    baseXp: 110,
  },
  {
    slug: "chapter-4-mission-2",
    chapterOrder: 4,
    order: 2,
    title: "누적기 초기값",
    description: "누적 합이 항상 1 큽니다. `total = 1` 로 시작해 모든 결과가 +1 됩니다. 누적기는 합은 0, 곱은 1에서 시작해야 합니다. `total = 0` 으로 수정하세요.",
    difficulty: 3,
    isBoss: false,
    bugTypeSlug: "loop",
    initialCode: "n = int(input())\ntotal = 1\nfor i in range(1, n + 1):\n    total += i\nprint(total)\n",
    referenceSolution: "n = int(input())\ntotal = 0\nfor i in range(1, n + 1):\n    total += i\nprint(total)\n",
    tests: [
        {
            "order": 1,
            "input": "5\n",
            "expectedOutput": "15",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "1\n",
            "expectedOutput": "1",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "3\n",
            "expectedOutput": "6",
            "isHidden": true
        }
    ],
    hints: ["합계를 누적할 때 초기값은 0이어야 합니다.","total = 1로 시작하면 1이 더해집니다.","`total = 0`으로 수정하세요."],
    explanation: "합계를 누적할 때 초기값은 0이어야 합니다. 1로 시작하면 결과가 항상 1만큼 커집니다.",
    concepts: ["누적 변수","초기값","for"],
    baseXp: 110,
  },
  {
    slug: "chapter-4-mission-3",
    chapterOrder: 4,
    order: 3,
    title: "팩토리얼 계산",
    description: "팩토리얼 while 루프가 끝나지 않습니다. `i += 1` 이 없어 `i` 가 1에 갇혀 무한루프·타임아웃이 납니다. 루프 블록 안에 `i += 1` 을 추가해 정상 종료되게 하세요.",
    difficulty: 4,
    isBoss: false,
    bugTypeSlug: "loop",
    initialCode: "n = int(input())\nresult = 1\ni = 1\nwhile i <= n:\n    result *= i\nprint(result)\n",
    referenceSolution: "n = int(input())\nresult = 1\ni = 1\nwhile i <= n:\n    result *= i\n    i += 1\nprint(result)\n",
    tests: [
        {
            "order": 1,
            "input": "5\n",
            "expectedOutput": "120",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "1\n",
            "expectedOutput": "1",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "3\n",
            "expectedOutput": "6",
            "isHidden": true
        }
    ],
    hints: ["while 루프 안에서 i가 변하는지 확인해보세요.","`i += 1`이 없으면 i가 영원히 1로 유지됩니다.","while 블록 안에 `i += 1`을 추가하세요."],
    explanation: "while 루프 안에서 i를 증가시키지 않으면 i가 영원히 1로 유지되어 무한루프가 됩니다.",
    concepts: ["while","팩토리얼","무한루프"],
    baseXp: 120,
  },
  {
    slug: "chapter-4-mission-4",
    chapterOrder: 4,
    order: 4,
    title: "거꾸로 출력",
    description: "N부터 1까지 역순 출력이 잘못된 range 를 씁니다. `range(1, n)` 으론 역순을 만들 수 없습니다. `range(n, 0, -1)` 로 `n, n-1, ..., 1` 을 한 줄씩 출력하게 고치세요.",
    difficulty: 4,
    isBoss: false,
    bugTypeSlug: "loop",
    initialCode: "n = int(input())\nfor i in range(1, n):\n    print(n - i + 1)\n",
    referenceSolution: "n = int(input())\nfor i in range(n, 0, -1):\n    print(i)\n",
    tests: [
        {
            "order": 1,
            "input": "3\n",
            "expectedOutput": "3\n2\n1",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "1\n",
            "expectedOutput": "1",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "5\n",
            "expectedOutput": "5\n4\n3\n2\n1",
            "isHidden": true
        }
    ],
    hints: ["range의 세 번째 인자는 증감값입니다.","range(n, 0, -1)은 n부터 1까지 거꾸로 반복합니다.","`range(n, 0, -1)`로 수정하세요."],
    explanation: "range의 세 번째 인자를 -1로 설정하면 거꾸로 반복할 수 있습니다.",
    concepts: ["range()","역방향 반복","for"],
    baseXp: 120,
  },
  {
    slug: "chapter-4-mission-5",
    chapterOrder: 4,
    order: 5,
    title: "숫자 합계",
    description: "합계 누적에 오타가 있습니다. `total =+ x` 는 `+=` 가 아니라 `= +x` 할당이라 마지막 값만 남습니다. `total += x` 로 공백을 제거해 누적되게 하세요.",
    difficulty: 4,
    isBoss: false,
    bugTypeSlug: "loop",
    initialCode: "nums = list(map(int, input().split()))\ntotal = 0\nfor x in nums:\n    total =+ x\nprint(total)\n",
    referenceSolution: "nums = list(map(int, input().split()))\ntotal = 0\nfor x in nums:\n    total += x\nprint(total)\n",
    tests: [
        {
            "order": 1,
            "input": "1 2 3\n",
            "expectedOutput": "6",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "5\n",
            "expectedOutput": "5",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "10 20 30\n",
            "expectedOutput": "60",
            "isHidden": true
        }
    ],
    hints: ["`total =+ x`와 `total += x`는 다릅니다.","`=+`는 할당(`=`)과 양수(`+`)입니다.","`total += x`로 공백을 제거하세요."],
    explanation: "`total =+ x`는 `total = (+x)` 즉, x를 total에 할당합니다. `total += x`는 total에 x를 더해야 합니다.",
    concepts: ["+=","오타","누적 변수"],
    baseXp: 120,
  },
  {
    slug: "chapter-4-mission-6",
    chapterOrder: 4,
    order: 6,
    title: "소수 판별",
    description: "소수 판별 루프가 잘못된 범위와 1 판별을 합니다. `range(1,n)` 은 1로 나눠 항상 `False` 가 되고 1도 소수로 처리합니다. `n<2` 분기와 `range(2, int(n**0.5)+1)` 로 효율·정확히 고치세요.",
    difficulty: 5,
    isBoss: false,
    bugTypeSlug: "loop",
    initialCode: "n = int(input())\nis_prime = True\nfor i in range(1, n):\n    if n % i == 0:\n        is_prime = False\nif is_prime:\n    print(\"prime\")\nelse:\n    print(\"not prime\")\n",
    referenceSolution: "n = int(input())\nif n < 2:\n    print(\"not prime\")\nelse:\n    is_prime = True\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            is_prime = False\n            break\n    if is_prime:\n        print(\"prime\")\n    else:\n        print(\"not prime\")\n",
    tests: [
        {
            "order": 1,
            "input": "7\n",
            "expectedOutput": "prime",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "9\n",
            "expectedOutput": "not prime",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "1\n",
            "expectedOutput": "not prime",
            "isHidden": true
        }
    ],
    hints: ["range(2, n)은 n까지 모든 숫자를 검사합니다 (비효율적).","n의 제곱근까지만 검사하면 충분합니다.","`range(2, int(n**0.5) + 1)`로 경계를 줄이세요."],
    explanation: "1은 소수가 아니며, 2 이상의 수는 제곱근까지만 약수가 있는지 검사하면 충분합니다. 약수를 찾으면 즉시 반복을 끝내 불필요한 계산도 줄일 수 있습니다.",
    concepts: ["for","range()","소수"],
    baseXp: 140,
  },
  {
    slug: "chapter-4-mission-7",
    chapterOrder: 4,
    order: 7,
    title: "별 삼각형",
    description: "별 삼각형이 한 줄씩 짧습니다. `\"*\"*(i-1)` 은 1번째 줄이 0개가 됩니다. `\"*\"*i` 로 `i` 개 별이 찍히게 수정하세요. 입력 `n` → 1~n개 별 삼각형.",
    difficulty: 5,
    isBoss: false,
    bugTypeSlug: "loop",
    initialCode: "n = int(input())\nfor i in range(1, n + 1):\n    print(\"*\" * (i - 1))\n",
    referenceSolution: "n = int(input())\nfor i in range(1, n + 1):\n    print(\"*\" * i)\n",
    tests: [
        {
            "order": 1,
            "input": "3\n",
            "expectedOutput": "*\n**\n***",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "1\n",
            "expectedOutput": "*",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "5\n",
            "expectedOutput": "*\n**\n***\n****\n*****",
            "isHidden": true
        }
    ],
    hints: ["i=1일 때 별이 몇 개 출력되는지 확인해보세요.","`i - 1`은 항상 1개 적게 출력합니다.","`\"*\" * i`로 수정하세요."],
    explanation: "i=1일 때 `i-1=0`이므로 별이 출력되지 않습니다. `*i`로 해야 첫 줄에 별 1개가 출력됩니다.",
    concepts: ["for","range()","문자열 곱셈"],
    baseXp: 140,
  },
  {
    slug: "chapter-4-mission-8",
    chapterOrder: 4,
    order: 8,
    title: "구구단 출력",
    description: "구구단 출력이 덧셈을 합니다. `f\"{n} x {i} = {n + i}\"` 는 곱이 아니라 합입니다. `{n * i}` 로 수정해 `n*1 ~ n*9` 구구단이 완성되게 하세요.",
    difficulty: 5,
    isBoss: true,
    bugTypeSlug: "loop",
    initialCode: "n = int(input())\nfor i in range(1, 10):\n    print(f\"{n} x {i} = {n + i}\")\n",
    referenceSolution: "n = int(input())\nfor i in range(1, 10):\n    print(f\"{n} x {i} = {n * i}\")\n",
    tests: [
        {
            "order": 1,
            "input": "3\n",
            "expectedOutput": "3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "7\n",
            "expectedOutput": "7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35\n7 x 6 = 42\n7 x 7 = 49\n7 x 8 = 56\n7 x 9 = 63",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "9\n",
            "expectedOutput": "9 x 1 = 9\n9 x 2 = 18\n9 x 3 = 27\n9 x 4 = 36\n9 x 5 = 45\n9 x 6 = 54\n9 x 7 = 63\n9 x 8 = 72\n9 x 9 = 81",
            "isHidden": true
        }
    ],
    hints: ["f 문자열의 포맷을 확인해보세요.","곱셈 결과가 올바르게 출력되는지 확인하세요.","`{n * i}` 부분의 괄호를 확인하세요."],
    explanation: "f 문자열에서 표현식을 올바르게 감싸야 합니다. 이 문제는 포맷을 정확히 맞추는 연습입니다.",
    concepts: ["for","f 문자열","포맷"],
    baseXp: 140,
  },
];
