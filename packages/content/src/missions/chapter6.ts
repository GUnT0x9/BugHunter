// noqa: SIZE_OK - data file with 8 missions per chapter, splitting would fragment chapter cohesion
import type { MissionSeed } from '../types.js';

export const chapter6Missions: MissionSeed[] = [
  {
    slug: 'chapter-6-mission-1',
    chapterOrder: 6,
    order: 1,
    title: '마지막 원소',
    description:
      '마지막 원소 접근이 범위를 벗어납니다. `nums[len(nums)]` 는 존재하지 않는 인덱스로 `IndexError` 입니다. `nums[-1]` 또는 `nums[len(nums)-1]` 로 마지막 값을 출력하게 고치세요.',
    difficulty: 3,
    isBoss: false,
    bugTypeSlug: 'index',
    initialCode: 'nums = list(map(int, input().split()))\nprint(nums[len(nums)])\n',
    referenceSolution: 'nums = list(map(int, input().split()))\nprint(nums[-1])\n',
    tests: [
      {
        order: 1,
        input: '1 2 3\n',
        expectedOutput: '3',
        isHidden: false,
      },
      {
        order: 2,
        input: '5\n',
        expectedOutput: '5',
        isHidden: false,
      },
      {
        order: 3,
        input: '10 20\n',
        expectedOutput: '20',
        isHidden: true,
      },
    ],
    hints: [
      '리스트의 길이가 3일 때 마지막 인덱스는 2입니다.',
      '`len(nums)`는 리스트의 길이를 반환합니다.',
      '`nums[-1]`로 마지막 원소를 출력하세요.',
    ],
    explanation:
      '인덱스는 0부터 시작하므로 마지막 유효 인덱스는 `len(nums) - 1`입니다. `nums[-1]`은 마지막 원소를 간편하게 가져옵니다.',
    concepts: ['list', '인덱스', 'IndexError'],
    baseXp: 110,
  },
  {
    slug: 'chapter-6-mission-2',
    chapterOrder: 6,
    order: 2,
    title: '중앙값 구하기',
    description:
      '홀수 개 정수의 중앙값을 구하기 전에 정렬이 빠졌습니다. `nums[n//2]`는 입력 순서의 가운데 값일 뿐입니다. `sorted(nums)`로 정렬한 뒤 중간 인덱스의 값을 출력하세요.',
    difficulty: 4,
    isBoss: false,
    bugTypeSlug: 'index',
    initialCode: 'nums = list(map(int, input().split()))\nn = len(nums)\nprint(nums[n // 2])\n',
    referenceSolution:
      'nums = sorted(list(map(int, input().split())))\nn = len(nums)\nprint(nums[n // 2])\n',
    tests: [
      {
        order: 1,
        input: '1 2 3 4 5\n',
        expectedOutput: '3',
        isHidden: false,
      },
      {
        order: 2,
        input: '3 1 2\n',
        expectedOutput: '2',
        isHidden: false,
      },
      {
        order: 3,
        input: '50 10 40 20 30\n',
        expectedOutput: '30',
        isHidden: true,
      },
    ],
    hints: [
      '`nums[n // 2]` 가 정렬 전 리스트에서 어떤 값을 가지는지 확인해보세요.',
      '`3 1 2` 에서 `n//2 = 1` 이면 정렬 전 1, 정렬 후 2가 됩니다.',
      '`sorted(nums)` 로 먼저 정렬한 뒤 중앙값을 꺼내세요.',
    ],
    explanation:
      '중앙값은 정렬 후 중간 위치의 값입니다. 정렬하지 않으면 입력 순서 그대로의 중간값이라 잘못된 결과가 나옵니다. `sorted()` 로 정렬한 뒤 `n//2` 인덱스를 사용해야 합니다.',
    concepts: ['list', 'sorted', '중앙값'],
    baseXp: 120,
  },
  {
    slug: 'chapter-6-mission-3',
    chapterOrder: 6,
    order: 3,
    title: '문자 빈도 세기',
    description: '문자열에서 특정 문자의 빈도를 세세요.',
    difficulty: 4,
    isBoss: false,
    bugTypeSlug: 'index',
    initialCode:
      'text = input().strip()\ntarget = "a"\ncount = 0\nfor ch in text:\n    if ch = target:\n        count += 1\nprint(count)\n',
    referenceSolution:
      'text = input().strip()\ntarget = "a"\ncount = 0\nfor ch in text:\n    if ch == target:\n        count += 1\nprint(count)\n',
    tests: [
      {
        order: 1,
        input: 'banana\n',
        expectedOutput: '3',
        isHidden: false,
      },
      {
        order: 2,
        input: 'hello\n',
        expectedOutput: '0',
        isHidden: false,
      },
      {
        order: 3,
        input: 'aaa\n',
        expectedOutput: '3',
        isHidden: true,
      },
    ],
    hints: [
      '`ch = target`은 할당입니다.',
      '비교에는 `==`를 사용합니다.',
      '`ch == target`으로 수정하세요.',
    ],
    explanation:
      '`=`는 할당 연산자이고 `==`는 비교 연산자입니다. `ch = target`은 ch에 target을 할당할 뿐 비교하지 않습니다.',
    concepts: ['for', '==', '카운트'],
    baseXp: 120,
  },
  {
    slug: 'chapter-6-mission-4',
    chapterOrder: 6,
    order: 4,
    title: '리스트 역순',
    description:
      '리스트 뒤집기가 `None` 을 출력합니다. `nums.reverse()` 는 제자리 변경이며 반환값이 `None` 입니다. `nums.reverse()` 후 `nums` 자체를 `" ".join(map(str, nums))` 로 출력하게 고치세요.',
    difficulty: 4,
    isBoss: false,
    bugTypeSlug: 'index',
    initialCode: 'nums = list(map(int, input().split()))\nresult = nums.reverse()\nprint(result)\n',
    referenceSolution:
      'nums = list(map(int, input().split()))\nnums.reverse()\nprint(" ".join(map(str, nums)))\n',
    tests: [
      {
        order: 1,
        input: '1 2 3\n',
        expectedOutput: '3 2 1',
        isHidden: false,
      },
      {
        order: 2,
        input: '5 1\n',
        expectedOutput: '1 5',
        isHidden: false,
      },
      {
        order: 3,
        input: '10 20 30\n',
        expectedOutput: '30 20 10',
        isHidden: true,
      },
    ],
    hints: [
      '`list.reverse()`는 None을 반환합니다.',
      'reverse()는 리스트를 직접 변경합니다.',
      '`result = nums.reverse()` 대신 `nums.reverse()` 후 `nums`를 출력하세요.',
    ],
    explanation:
      '`list.reverse()`는 리스트를 제자리에서 변경하고 None을 반환합니다. 반환 값을 저장하면 None이 출력됩니다.',
    concepts: ['list', 'reverse', 'None'],
    baseXp: 120,
  },
  {
    slug: 'chapter-6-mission-5',
    chapterOrder: 6,
    order: 5,
    title: '중복 제거 (순서 유지)',
    description:
      '중복 제거가 순서를 망칩니다. `list(set(nums))` 는 순서가 무작위라 `1 1 2 3 2` → `1 2 3` 보장이 안 됩니다. 처음 등장한 값만 `result` 에 `append` 하는 순회로 순서를 유지해 제거하세요.',
    difficulty: 5,
    isBoss: false,
    bugTypeSlug: 'logic',
    initialCode:
      'nums = list(map(int, input().split()))\nresult = list(set(nums))\nprint(" ".join(map(str, result)))\n',
    referenceSolution:
      'nums = list(map(int, input().split()))\nresult = []\nseen = set()\nfor x in nums:\n    if x not in seen:\n        seen.add(x)\n        result.append(x)\nprint(" ".join(map(str, result)))\n',
    tests: [
      {
        order: 1,
        input: '1 1 2 3 2\n',
        expectedOutput: '1 2 3',
        isHidden: false,
      },
      {
        order: 2,
        input: '5 5 5\n',
        expectedOutput: '5',
        isHidden: false,
      },
      {
        order: 3,
        input: '3 1 2 1\n',
        expectedOutput: '3 1 2',
        isHidden: true,
      },
    ],
    hints: [
      '`set()`은 순서를 보장하지 않습니다.',
      'ordered dict나 리스트로 순서를 유지해야 합니다.',
      '리스트를 순회하면서 이미 있는 값은 건너뛰세요.',
    ],
    explanation:
      '`set()`은 순서가 없으므로 변환 후 순서가 바뀝니다. 리스트를 순회하면서 처음 등장하는 값만 추가하면 순서를 유지할 수 있습니다.',
    concepts: ['list', 'set', '순서 유지'],
    baseXp: 140,
  },
  {
    slug: 'chapter-6-mission-6',
    chapterOrder: 6,
    order: 6,
    title: '두 정렬 리스트 병합',
    description:
      '두 정렬 리스트 병합이 남은 원소를 버립니다. `while` 종료 후 `a[i:]` 와 `b[j:]` 가 남아도 출력하지 않습니다. 루프 뒤 `result.extend(a[i:])` 와 `extend(b[j:])` 를 추가하세요.',
    difficulty: 5,
    isBoss: false,
    bugTypeSlug: 'index',
    initialCode:
      'a = list(map(int, input().split()))\nb = list(map(int, input().split()))\nresult = []\ni, j = 0, 0\nwhile i < len(a) and j < len(b):\n    if a[i] < b[j]:\n        result.append(a[i])\n        i += 1\n    else:\n        result.append(b[j])\n        j += 1\nprint(" ".join(map(str, result)))\n',
    referenceSolution:
      'a = list(map(int, input().split()))\nb = list(map(int, input().split()))\nresult = []\ni, j = 0, 0\nwhile i < len(a) and j < len(b):\n    if a[i] <= b[j]:\n        result.append(a[i])\n        i += 1\n    else:\n        result.append(b[j])\n        j += 1\nresult.extend(a[i:])\nresult.extend(b[j:])\nprint(" ".join(map(str, result)))\n',
    tests: [
      {
        order: 1,
        input: '1 3 5\n2 4 6\n',
        expectedOutput: '1 2 3 4 5 6',
        isHidden: false,
      },
      {
        order: 2,
        input: '1 2 3\n4 5 6\n',
        expectedOutput: '1 2 3 4 5 6',
        isHidden: false,
      },
      {
        order: 3,
        input: '1 3\n2\n',
        expectedOutput: '1 2 3',
        isHidden: true,
      },
    ],
    hints: [
      'while 루프가 끝난 후 남은 원소가 있는지 확인하세요.',
      '`<` 대신 `<=`를 사용하면 같은 값도 처리합니다.',
      '루프 종료 후 `a[i:]`와 `b[j:]`를 결과에 추가하세요.',
    ],
    explanation:
      'while 루프는 하나의 리스트가 소진되면 멈추지만, 다른 리스트에 남은 원소가 있습니다. 루프 종료 후 남은 원소를 모두 추가해야 합니다.',
    concepts: ['while', '리스트', '병합 정렬'],
    baseXp: 140,
  },
  {
    slug: 'chapter-6-mission-7',
    chapterOrder: 6,
    order: 7,
    title: '최댓값 키',
    description:
      '이름과 점수 세 줄을 읽어 최고 점수의 이름을 출력해야 하지만 `max(scores)`가 이름의 사전순 최댓값을 선택합니다. `key=scores.get`을 사용해 점수가 가장 큰 이름을 찾으세요.',
    difficulty: 5,
    isBoss: false,
    bugTypeSlug: 'index',
    initialCode:
      'scores = {}\nfor _ in range(3):\n    name, score = input().split()\n    scores[name] = int(score)\nwinner = max(scores)\nprint(winner)\n',
    referenceSolution:
      'scores = {}\nfor _ in range(3):\n    name, score = input().split()\n    scores[name] = int(score)\nwinner = max(scores, key=scores.get)\nprint(winner)\n',
    tests: [
      {
        order: 1,
        input: 'Alice 85\nBob 92\nCharlie 78\n',
        expectedOutput: 'Bob',
        isHidden: false,
      },
      {
        order: 2,
        input: 'Zed 1\nAmy 9\nMin 5\n',
        expectedOutput: 'Amy',
        isHidden: false,
      },
      {
        order: 3,
        input: 'Zoe 70\nAmy 100\nMike 90\n',
        expectedOutput: 'Amy',
        isHidden: true,
      },
    ],
    hints: [
      '`max(scores)`는 키를 기준으로 비교합니다.',
      '값을 기준으로 비교하려면 `key` 인자를 사용합니다.',
      '`max(scores, key=scores.get)`으로 수정하세요.',
    ],
    explanation:
      '`max(scores)`는 사전순으로 가장 큰 키를 반환합니다. 값을 기준으로 하려면 `key=scores.get`을 지정해야 합니다.',
    concepts: ['dict', 'max', 'key'],
    baseXp: 140,
  },
  {
    slug: 'chapter-6-mission-8',
    chapterOrder: 6,
    order: 8,
    title: '짝수/홀수 집계',
    description:
      '짝수/홀수 합계 조건이 뒤바뀌었습니다. `x%2==1` 을 짝수 합에 더해 `1 2 3 4 5 6` 이 뒤집힙니다. `x%2==0` 이면 `even_sum`, 그 외 `odd_sum` 으로 분기를 교환하세요.',
    difficulty: 5,
    isBoss: true,
    bugTypeSlug: 'logic',
    initialCode:
      'nums = list(map(int, input().split()))\neven_sum = 0\nodd_sum = 0\nfor x in nums:\n    if x % 2 == 1:\n        even_sum += x\n    else:\n        odd_sum += x\nprint("even=" + str(even_sum))\nprint("odd=" + str(odd_sum))\n',
    referenceSolution:
      'nums = list(map(int, input().split()))\neven_sum = 0\nodd_sum = 0\nfor x in nums:\n    if x % 2 == 0:\n        even_sum += x\n    else:\n        odd_sum += x\nprint("even=" + str(even_sum))\nprint("odd=" + str(odd_sum))\n',
    tests: [
      {
        order: 1,
        input: '1 2 3 4 5 6\n',
        expectedOutput: 'even=12\nodd=9',
        isHidden: false,
      },
      {
        order: 2,
        input: '2 4 6\n',
        expectedOutput: 'even=12\nodd=0',
        isHidden: false,
      },
      {
        order: 3,
        input: '1 3 5\n',
        expectedOutput: 'even=0\nodd=9',
        isHidden: true,
      },
    ],
    hints: [
      '`x % 2 == 1`은 홀수를 판별합니다.',
      '짝수를 판별하려면 `x % 2 == 0`을 사용합니다.',
      'even_sum과 odd_sum의 조건을 바꾸세요.',
    ],
    explanation:
      '`x % 2 == 1`은 홀수인데, 짝수 합에 더하고 있습니다. 조건을 `x % 2 == 0`으로 바꿔야 합니다.',
    concepts: ['for', 'if', '짝수/홀수'],
    baseXp: 140,
  },
];
