import type { MissionSeed } from '../types.js';

export const chapter1Missions: MissionSeed[] = [
  {
    slug: "chapter-1-mission-1",
    chapterOrder: 1,
    order: 1,
    title: "닫히지 않은 인사",
    description: "BugHunter 환영 스크립트가 실행조차 되지 않습니다. 이름 한 줄을 입력받은 뒤 `BugHunter 이름`을 출력해야 하지만 print 함수의 닫는 괄호 `)`가 빠져 SyntaxError가 발생합니다. 괄호를 닫아 정확한 환영 문구를 출력하세요.",
    difficulty: 1,
    isBoss: false,
    bugTypeSlug: "syntax",
    initialCode: "name = input().strip()\nprint(\"BugHunter\", name\n",
    referenceSolution: "name = input().strip()\nprint(\"BugHunter\", name)\n",
    tests: [
        {
            "order": 1,
            "input": "Alice\n",
            "expectedOutput": "BugHunter Alice",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "민수\n",
            "expectedOutput": "BugHunter 민수",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "Python\n",
            "expectedOutput": "BugHunter Python",
            "isHidden": true
        }
    ],
    hints: ["에디터에서 `print` 줄의 괄호 개수를 세어 보세요. `(` 와 `)` 가 짝이 맞나요?","두 번째 인자인 `name` 뒤에 닫는 괄호 `)` 가 빠져 있습니다.","`print(\"BugHunter\", name)` 로 함수 호출을 완성하세요."],
    explanation: "Python에서 함수 호출은 여는 괄호와 닫는 괄호가 짝을 이뤄야 합니다. `name` 뒤에 닫는 괄호가 없으면 파서가 문장을 끝내지 못해 SyntaxError가 발생합니다.",
    concepts: ["print()","괄호","SyntaxError"],
    baseXp: 100,
  },
  {
    slug: "chapter-1-mission-2",
    chapterOrder: 1,
    order: 2,
    title: "따옴표 불일치",
    description: "이름 한 줄을 입력받아 `Hello 이름`을 출력하는 코드가 따옴표 불일치로 실행되지 않습니다. `'`로 연 문자열을 `\"`로 닫은 부분을 같은 종류의 따옴표로 맞추세요.",
    difficulty: 1,
    isBoss: false,
    bugTypeSlug: "syntax",
    initialCode: "name = input().strip()\nprint('Hello ' + name + \" )\n",
    referenceSolution: "name = input().strip()\nprint(\"Hello \" + name)\n",
    tests: [
        {
            "order": 1,
            "input": "World\n",
            "expectedOutput": "Hello World",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "BugHunter\n",
            "expectedOutput": "Hello BugHunter",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "파이썬\n",
            "expectedOutput": "Hello 파이썬",
            "isHidden": true
        }
    ],
    hints: ["여는 따옴표와 닫는 따옴표가 같은 종류인지 확인해보세요.","홑따옴표(`'`)로 열고 겹따옴표(`\"`)로 닫고 있습니다.","여는 따옴표도 겹따옴표로 바꾸세요."],
    explanation: "Python 문자열은 여는 따옴표와 닫는 따옴표의 종류가 반드시 일치해야 합니다. `'`로 시작하고 `\"`로 끝내면 하나의 문자열로 인식되지 않아 SyntaxError가 납니다. `\"Hello World\"` 처럼 같은 따옴표로 감싸야 합니다.",
    concepts: [" 문자열","따옴표","SyntaxError"],
    baseXp: 100,
  },
  {
    slug: "chapter-1-mission-3",
    chapterOrder: 1,
    order: 3,
    title: "문자열 안의 따옴표",
    description: "단어 한 줄을 입력받아 `He said \"단어\"` 형식으로 출력해야 하지만 문자열 안의 따옴표가 바깥 문자열과 충돌합니다. 안쪽 따옴표를 이스케이프해 대사를 정확히 출력하세요.",
    difficulty: 2,
    isBoss: false,
    bugTypeSlug: "syntax",
    initialCode: "word = input().strip()\nprint(f\"He said \"{word}\"\")\n",
    referenceSolution: "word = input().strip()\nprint(f\"He said \\\"{word}\\\"\")\n",
    tests: [
        {
            "order": 1,
            "input": "Hi\n",
            "expectedOutput": "He said \"Hi\"",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "BugHunter\n",
            "expectedOutput": "He said \"BugHunter\"",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "파이썬\n",
            "expectedOutput": "He said \"파이썬\"",
            "isHidden": true
        }
    ],
    hints: ["문자열 안에 따옴표를 넣으려면 별도 처리가 필요합니다.","백슬래시(`\\`)를 사용해 따옴표를 이스케이프하세요.","`\\\"`로 문자열 안의 따옴표를 감싸세요."],
    explanation: "문자열 안의 따옴표는 이스케이프(`\\\"`)하지 않으면 문자열이 조기에 끝나는 것으로 해석됩니다.",
    concepts: ["print()","이스케이프","SyntaxError"],
    baseXp: 110,
  },
  {
    slug: "chapter-1-mission-4",
    chapterOrder: 1,
    order: 4,
    title: "문자열과 숫자 충돌",
    description: "정수 한 줄을 입력받아 `합계: 숫자`를 출력하는 코드가 TypeError로 중단됩니다. 문자열과 정수를 `+`로 직접 연결하지 말고 print의 콤마 또는 형변환을 사용해 정확히 출력하세요.",
    difficulty: 2,
    isBoss: false,
    bugTypeSlug: "syntax",
    initialCode: "total = int(input())\nprint(\"합계: \" + total)\n",
    referenceSolution: "total = int(input())\nprint(\"합계:\", total)\n",
    tests: [
        {
            "order": 1,
            "input": "42\n",
            "expectedOutput": "합계: 42",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "0\n",
            "expectedOutput": "합계: 0",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "-7\n",
            "expectedOutput": "합계: -7",
            "isHidden": true
        }
    ],
    hints: ["`+` 연산자는 같은 자료형끼리만 사용할 수 있습니다.","콤마(`,`)를 사용하면 자료형 변환 없이도 출력할 수 있습니다.","`print(\"합계:\", 42)`로 수정하세요."],
    explanation: "`+` 연산자는 문자열과 정수를 합할 수 없으므로 TypeError가 발생합니다. 콤마를 사용하면 자동으로 공백을 넣어 출력합니다.",
    concepts: ["print()","TypeError","자료형"],
    baseXp: 110,
  },
  {
    slug: "chapter-1-mission-5",
    chapterOrder: 1,
    order: 5,
    title: "두 줄 박스 출력",
    description: "가로 길이 한 줄을 입력받아 `+`, 길이만큼의 `-`, `+`로 만든 테두리를 두 번 출력해야 합니다. 두 번째 print에 괄호가 없어 SyntaxError가 발생하므로 Python 3 함수 호출 형식으로 고치세요.",
    difficulty: 3,
    isBoss: true,
    bugTypeSlug: "syntax",
    initialCode: "width = int(input())\nborder = \"+\" + \"-\" * width + \"+\"\nprint(border)\nprint border\n",
    referenceSolution: "width = int(input())\nborder = \"+\" + \"-\" * width + \"+\"\nprint(border)\nprint(border)\n",
    tests: [
        {
            "order": 1,
            "input": "2\n",
            "expectedOutput": "+--+\n+--+",
            "isHidden": false
        },
        {
            "order": 2,
            "input": "1\n",
            "expectedOutput": "+-+\n+-+",
            "isHidden": false
        },
        {
            "order": 3,
            "input": "4\n",
            "expectedOutput": "+----+\n+----+",
            "isHidden": true
        }
    ],
    hints: ["두 번째 print에도 괄호가 필요한지 확인해보세요.","Python 3에서는 print가 함수이므로 괄호가 필수입니다.","두 번째 줄에도 `print(\"+--+\")`로 괄호를 추가하세요."],
    explanation: "Python 3에서 print는 함수이므로 반드시 괄호가 필요합니다. 두 번째 print에 괄호가 빠져 실행되지 않습니다.",
    concepts: ["print()","괄호","Python 3"],
    baseXp: 130,
  },
];
