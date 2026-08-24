import type { MissionSeed } from '../types.js';

export const chapter7Missions: MissionSeed[] = [
  {
    slug: "chapter-7-mission-1",
    chapterOrder: 7,
    order: 1,
    title: "0으로 나누기",
    description: "0으로 나눌 때 프로그램이 죽습니다. `10 // n` 에서 `n=0` 이면 `ZeroDivisionError` 로 크래시됩니다. `try/except ZeroDivisionError` 로 감싸 예외 시 `error` 를 출력하게 하세요.",
    difficulty: 4,
    isBoss: false,
    bugTypeSlug: "exception",
    initialCode: "n = int(input())\nprint(10 // n)\n",
    referenceSolution: "n = int(input())\ntry:\n    print(10 // n)\nexcept ZeroDivisionError:\n    print(\"error\")\n",
    tests: [
        {
            "order": 1,
            "input": "2\n",
            "expectedOutput": "5",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "5\n",
            "expectedOutput": "2",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "0\n",
            "expectedOutput": "error",
            "isHidden": true
        }
    ],
    hints: ["0으로 나눌 때 Python이 내는 예외 이름을 확인하세요.","`ZeroDivisionError`를 처리해야 합니다.","`try`/`except ZeroDivisionError`로 감싸세요."],
    explanation: "0으로 나누면 ZeroDivisionError가 발생합니다. try/except로 처리해야 프로그램이 중단되지 않습니다.",
    concepts: ["try","except","ZeroDivisionError"],
    baseXp: 120,
  },
  {
    slug: "chapter-7-mission-2",
    chapterOrder: 7,
    order: 2,
    title: "숫자 변환 안전하게",
    description: "문자열을 숫자로 바꿀 때 크래시됩니다. `int(\"abc\")`·`int(\"3.5\")` 는 `ValueError` 입니다. `try/except ValueError` 로 감싸 성공 시 `*2` 결과, 실패 시 `not a number` 를 출력하게 하세요.",
    difficulty: 5,
    isBoss: false,
    bugTypeSlug: "exception",
    initialCode: "data = input().strip()\nresult = int(data) * 2\nprint(result)\n",
    referenceSolution: "data = input().strip()\ntry:\n    result = int(data) * 2\n    print(result)\nexcept ValueError:\n    print(\"not a number\")\n",
    tests: [
        {
            "order": 1,
            "input": "abc\n",
            "expectedOutput": "not a number",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "4\n",
            "expectedOutput": "8",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "3.5\n",
            "expectedOutput": "not a number",
            "isHidden": true
        }
    ],
    hints: ["`int(\"abc\")`는 ValueError를 발생시킵니다.","`try`/`except ValueError`로 처리하세요.","변환 실패 시 \"not a number\"를 출력하세요."],
    explanation: "int()는 숫자로 변환할 수 없는 문자열에서 ValueError를 발생시킵니다. try/except로 처리해야 합니다.",
    concepts: ["try","except","ValueError"],
    baseXp: 140,
  },
  {
    slug: "chapter-7-mission-3",
    chapterOrder: 7,
    order: 3,
    title: "파일 없음 처리",
    description: "입력받은 파일 이름을 열 때 파일이 없으면 프로그램이 중단됩니다. `open(filename)`을 `try/except FileNotFoundError`로 감싸 존재하지 않는 파일에는 `missing`을 출력하세요.",
    difficulty: 5,
    isBoss: false,
    bugTypeSlug: "exception",
    initialCode: "filename = input().strip()\nwith open(filename) as f:\n    content = f.read()\nprint(content)\n",
    referenceSolution: "filename = input().strip()\ntry:\n    with open(filename) as f:\n        content = f.read()\n    print(content)\nexcept FileNotFoundError:\n    print(\"missing\")\n",
    tests: [
        {
            "order": 1,
            "input": "data.txt\n",
            "expectedOutput": "missing",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "missing.json\n",
            "expectedOutput": "missing",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "notes.csv\n",
            "expectedOutput": "missing",
            "isHidden": true
        }
    ],
    hints: ["파일이 없으면 FileNotFoundError가 발생합니다.","`try`/`except FileNotFoundError`로 처리하세요.","파일 없음 시 \"missing\"을 출력하세요."],
    explanation: "존재하지 않는 파일을 열면 FileNotFoundError가 발생합니다. try/except로 처리해야 합니다.",
    concepts: ["try","except","FileNotFoundError"],
    baseXp: 140,
  },
  {
    slug: "chapter-7-mission-4",
    chapterOrder: 7,
    order: 4,
    title: "안전한 리스트 접근",
    description: "입력이 부족하거나 0 나누기 등 여러 예외가 동시에 가능합니다. `input().split()` 으로 두 수를 나누다 `IndexError/ZeroDivisionError/ValueError` 가 날 수 있습니다. `except (IndexError, ZeroDivisionError, ValueError)` 로 한 번에 `invalid input` 을 출력하게 하세요.",
    difficulty: 5,
    isBoss: false,
    bugTypeSlug: "exception",
    initialCode: "data = input().split()\nfirst = int(data[0])\nsecond = int(data[1])\nprint(first // second)\n",
    referenceSolution: "data = input().split()\ntry:\n    first = int(data[0])\n    second = int(data[1])\n    print(first // second)\nexcept (IndexError, ZeroDivisionError, ValueError):\n    print(\"invalid input\")\n",
    tests: [
        {
            "order": 1,
            "input": "10 2\n",
            "expectedOutput": "5",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "5 0\n",
            "expectedOutput": "invalid input",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "abc\n",
            "expectedOutput": "invalid input",
            "isHidden": true
        }
    ],
    hints: ["입력이 부족하면 IndexError가 발생합니다.","0으로 나누면 ZeroDivisionError가 발생합니다.","여러 예외를 `except (A, B, C)`로 한 번에 처리할 수 있습니다."],
    explanation: "여러 종류의 오류가 발생할 수 있으므로 복합 except로 처리해야 합니다.",
    concepts: ["try","except","복합 예외"],
    baseXp: 140,
  },
  {
    slug: "chapter-7-mission-5",
    chapterOrder: 7,
    order: 5,
    title: "최종 보스",
    description: "종합 보스: 빈 입력에서 `ZeroDivisionError`·`ValueError` 가 터집니다. `n=0` 이면 `sum(nums)/len(nums)` 와 `max(nums)` 가 모두 실패합니다. `if n==0: print(\"no data\")` 분기로 빈 입력을 먼저 처리하게 하세요. 그 외에는 합계/평균/최댓값을 출력합니다.",
    difficulty: 5,
    isBoss: true,
    bugTypeSlug: "exception",
    initialCode: "n = int(input())\nnums = []\nfor i in range(n):\n    nums.append(int(input()))\navg = sum(nums) / len(nums)\nprint(\"sum=\" + str(sum(nums)))\nprint(\"avg=\" + str(avg))\nprint(\"max=\" + str(max(nums)))\n",
    referenceSolution: "n = int(input())\nnums = []\nfor i in range(n):\n    nums.append(int(input()))\nif n == 0:\n    print(\"no data\")\nelse:\n    avg = sum(nums) / len(nums)\n    print(\"sum=\" + str(sum(nums)))\n    print(\"avg=\" + str(avg))\n    print(\"max=\" + str(max(nums)))\n",
    tests: [
        {
            "order": 1,
            "input": "3\n1\n2\n3\n",
            "expectedOutput": "sum=6\navg=2.0\nmax=3",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "0\n",
            "expectedOutput": "no data",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "1\n5\n",
            "expectedOutput": "sum=5\navg=5.0\nmax=5",
            "isHidden": true
        }
    ],
    hints: ["입력이 0이면 리스트가 비어 있습니다.","빈 리스트에서 `max()`와 나눗셈이 실패합니다.","`n == 0`일 때 \"no data\"를 출력하세요."],
    explanation: "입력이 0이면 리스트가 비어있어 ZeroDivisionError와 ValueError가 발생합니다. 먼저 빈 입력을 처리해야 합니다.",
    concepts: ["try","except","종합"],
    baseXp: 160,
  },
];
