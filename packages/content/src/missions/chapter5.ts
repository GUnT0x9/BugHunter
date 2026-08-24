import type { MissionSeed } from '../types.js';

export const chapter5Missions: MissionSeed[] = [
  {
    slug: "chapter-5-mission-1",
    chapterOrder: 5,
    order: 1,
    title: "return 누락",
    description: "정수 두 개를 입력받아 덧셈 함수의 결과를 출력해야 하지만 함수가 `None`을 반환합니다. `a + b`를 계산만 하지 말고 `return a + b`로 호출자에게 값을 반환하세요.",
    difficulty: 3,
    isBoss: false,
    bugTypeSlug: "function",
    initialCode: "def add(a, b):\n    a + b\n\na, b = map(int, input().split())\nprint(add(a, b))\n",
    referenceSolution: "def add(a, b):\n    return a + b\n\na, b = map(int, input().split())\nprint(add(a, b))\n",
    tests: [
        {
            "order": 1,
            "input": "2 3\n",
            "expectedOutput": "5",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "-2 7\n",
            "expectedOutput": "5",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "0 0\n",
            "expectedOutput": "0",
            "isHidden": true
        }
    ],
    hints: ["함수 안에서 값을 반환하려면 `return`이 필요합니다.","`a + b`만 쓰면 계산만 하고 반환하지 않습니다.","`return a + b`로 수정하세요."],
    explanation: "return문이 없으면 함수는 None을 반환합니다. 값을 반환하려면 return 키워드가 필요합니다.",
    concepts: ["function","return","None"],
    baseXp: 110,
  },
  {
    slug: "chapter-5-mission-2",
    chapterOrder: 5,
    order: 2,
    title: "매개변수 순서",
    description: "정수 두 개를 입력받아 첫 번째 수에서 두 번째 수를 빼야 하지만 함수의 계산 순서가 뒤바뀌었습니다. `b - a`를 `a - b`로 고쳐 입력 순서대로 뺄셈하세요.",
    difficulty: 3,
    isBoss: false,
    bugTypeSlug: "function",
    initialCode: "def sub(a, b):\n    return b - a\n\na, b = map(int, input().split())\nprint(sub(a, b))\n",
    referenceSolution: "def sub(a, b):\n    return a - b\n\na, b = map(int, input().split())\nprint(sub(a, b))\n",
    tests: [
        {
            "order": 1,
            "input": "10 3\n",
            "expectedOutput": "7",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "3 10\n",
            "expectedOutput": "-7",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "-2 -5\n",
            "expectedOutput": "3",
            "isHidden": true
        }
    ],
    hints: ["뺄셈에서 뺄 숫자와 빼지는 숫자의 순서를 확인하세요.","`b - a`는 3 - 10 = -7이 됩니다.","`a - b`로 수정하세요."],
    explanation: "`b - a`는 첫 번째에서 두 번째를 빼는 것이 아니라 반대입니다. `a - b`로 바꿔야 합니다.",
    concepts: ["function","return","뺄셈"],
    baseXp: 110,
  },
  {
    slug: "chapter-5-mission-3",
    chapterOrder: 5,
    order: 3,
    title: "재귀 팩토리얼",
    description: "재귀 팩토리얼 종료 조건이 `0` 을 반환합니다. `0!` 은 1인데 0을 반환하면 전체 곱이 0이 됩니다. `if n==0: return 1` 로 수정하세요.",
    difficulty: 4,
    isBoss: false,
    bugTypeSlug: "function",
    initialCode: "def fact(n):\n    if n == 0:\n        return 0\n    return n * fact(n - 1)\n\nn = int(input())\nprint(fact(n))\n",
    referenceSolution: "def fact(n):\n    if n == 0:\n        return 1\n    return n * fact(n - 1)\n\nn = int(input())\nprint(fact(n))\n",
    tests: [
        {
            "order": 1,
            "input": "5\n",
            "expectedOutput": "120",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "0\n",
            "expectedOutput": "1",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "7\n",
            "expectedOutput": "5040",
            "isHidden": true
        }
    ],
    hints: ["0의 팩토리얼은 얼마인지 확인해보세요.","0! = 1입니다.","`return 0`을 `return 1`로 수정하세요."],
    explanation: "0! = 1인데, 기존 코드는 0을 반환하여 결과가 0이 됩니다. 종료 조건에서 1을 반환해야 합니다.",
    concepts: ["function","재귀","종료 조건"],
    baseXp: 120,
  },
  {
    slug: "chapter-5-mission-4",
    chapterOrder: 5,
    order: 4,
    title: "거듭제곱 함수",
    description: "밑과 0 이상의 지수를 입력받아 거듭제곱을 계산하는 함수가 항상 0을 반환합니다. 곱셈 누적값을 올바른 항등원으로 초기화해 `base ** exp`와 같은 결과를 만드세요.",
    difficulty: 4,
    isBoss: false,
    bugTypeSlug: "function",
    initialCode: "def power(base, exp):\n    result = 0\n    for _ in range(exp):\n        result *= base\n    return result\n\nbase, exp = map(int, input().split())\nprint(power(base, exp))\n",
    referenceSolution: "def power(base, exp):\n    result = 1\n    for _ in range(exp):\n        result *= base\n    return result\n\nbase, exp = map(int, input().split())\nprint(power(base, exp))\n",
    tests: [
        {
            "order": 1,
            "input": "2 10\n",
            "expectedOutput": "1024",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "5 0\n",
            "expectedOutput": "1",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "3 4\n",
            "expectedOutput": "81",
            "isHidden": true
        }
    ],
    hints: ["0으로 시작하면 `0 * base` 는 항상 0입니다. 0의 거듭제곱은 얼마인가요?","곱셈 누적의 시작값은 1이어야 합니다. 0부터 시작하면 모든 결과가 0이 됩니다.","`result = 1` 로 초기값을 수정하세요."],
    explanation: "곱셈 누적의 시작값은 1이어야 합니다. 0에서 시작하면 `0 * base` 가 항상 0이므로 어떤 지수든 결과가 0이 됩니다.",
    concepts: ["function","for","거듭제곱"],
    baseXp: 120,
  },
  {
    slug: "chapter-5-mission-5",
    chapterOrder: 5,
    order: 5,
    title: "피보나치 수열",
    description: "0 이상의 정수 n을 입력받는 피보나치 함수가 같은 이전 항을 두 번 더합니다. 재귀식을 `fib(n-1) + fib(n-2)`로 수정해 입력마다 올바른 n번째 피보나치 수를 출력하세요.",
    difficulty: 5,
    isBoss: false,
    bugTypeSlug: "function",
    initialCode: "def fib(n):\n    if n <= 1:\n        return n\n    return fib(n - 1) + fib(n - 1)\n\nn = int(input())\nprint(fib(n))\n",
    referenceSolution: "def fib(n):\n    if n <= 1:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nn = int(input())\nprint(fib(n))\n",
    tests: [
        {
            "order": 1,
            "input": "10\n",
            "expectedOutput": "55",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "0\n",
            "expectedOutput": "0",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "7\n",
            "expectedOutput": "13",
            "isHidden": true
        }
    ],
    hints: ["피보나치 수열은 두 개의 이전 값을 더합니다.","`fib(n-1) + fib(n-1)`은 같은 값을 두 번 더합니다.","`fib(n - 2)`로 수정하세요."],
    explanation: "피보나치 수열은 `F(n) = F(n-1) + F(n-2)`입니다. `fib(n-1)`을 두 번 더하면 올바른 값이 나오지 않습니다.",
    concepts: ["function","재귀","피보나치"],
    baseXp: 140,
  },
  {
    slug: "chapter-5-mission-6",
    chapterOrder: 5,
    order: 6,
    title: "팰린드롬 판별",
    description: "팰린드롬 판별이 문자열을 뒤집지 않습니다. `s[1:]` 은 첫 글자만 제거합니다. `s[::-1]` 슬라이스로 전체를 뒤집어 비교하게 고치세요.",
    difficulty: 5,
    isBoss: false,
    bugTypeSlug: "function",
    initialCode: "def is_palindrome(s):\n    return s == s[1:]\n\nword = input().strip()\nprint(is_palindrome(word))\n",
    referenceSolution: "def is_palindrome(s):\n    return s == s[::-1]\n\nword = input().strip()\nprint(is_palindrome(word))\n",
    tests: [
        {
            "order": 1,
            "input": "level\n",
            "expectedOutput": "True",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "hello\n",
            "expectedOutput": "False",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "radar\n",
            "expectedOutput": "True",
            "isHidden": true
        }
    ],
    hints: ["`s[1:]`는 첫 글자를 제거합니다.","문자열을 뒤집으려면 슬라이싱을 사용합니다.","`s[::-1]`로 전체를 뒤집으세요."],
    explanation: "`s[1:]`은 첫 글자만 제거하고 뒤집지 않습니다. `s[::-1]`은 전체 문자열을 뒤집습니다.",
    concepts: ["function","슬라이싱","팰린드롬"],
    baseXp: 140,
  },
  {
    slug: "chapter-5-mission-7",
    chapterOrder: 5,
    order: 7,
    title: "최대공약수",
    description: "유클리드 호제법이 덧셈을 합니다. `a + b` 는 나머지가 아니라 합이라 무한루프입니다. `a % b` 로 나머지 연산을 쓰게 수정하세요.",
    difficulty: 5,
    isBoss: true,
    bugTypeSlug: "function",
    initialCode: "def gcd(a, b):\n    while b:\n        a, b = b, a + b\n    return a\n\na, b = map(int, input().split())\nprint(gcd(a, b))\n",
    referenceSolution: "def gcd(a, b):\n    while b:\n        a, b = b, a % b\n    return a\n\na, b = map(int, input().split())\nprint(gcd(a, b))\n",
    tests: [
        {
            "order": 1,
            "input": "12 18\n",
            "expectedOutput": "6",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "17 13\n",
            "expectedOutput": "1",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "48 180\n",
            "expectedOutput": "12",
            "isHidden": true
        }
    ],
    hints: ["유클리드 호제법에서 나머지를 구하는 연산자를 확인하세요.","`a + b`는 합을 구하는 연산입니다.","`a % b`로 나머지를 구하세요."],
    explanation: "유클리드 호제법은 나머지(`%`)를 사용합니다. `a + b`는 합을 구하므로 알고리즘이 동작하지 않습니다.",
    concepts: ["function","while","유클리드 호제법"],
    baseXp: 140,
  },
];
