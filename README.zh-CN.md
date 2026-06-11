# html-ppt · HTML PPT 스튜디오

> AI가 실제로 입력 가능한 HTML 프레젠테이션을 만들 수 있게 해주는 전문가 수준의 AgentSkill입니다.
> **36개 테마**, **15개 전체 데크 템플릿**, **31개 페이지 레이아웃**, **47개 애니메이션**
> (27 CSS + 20 Canvas FX) 및 새로운 **스피커 모드** - 픽셀 수준
> 완벽한 미리보기 + 문자 그대로의 텔레프롬프터 + 타이머. 순수 정적 HTML/CSS/JS, 빌드가 필요하지 않습니다.

**저자:** 루이스 &lt;sudolewis@gmail.com&gt;
**계약:** MIT
**English docs:** [README.md](README.md)

![html-ppt 표지 · 실시간 미리보기](docs/readme/hero.gif)

> **36개 테마 × 20 Canvas FX × 31개 레이아웃 × 15개 전체 데크 + 스피커 모드**를 설치하는 명령 한 줄.
> 위 사진의 모든 미리보기는 스크린샷이나 컬러 카드가 아닌 실제 템플릿 파일을 로드하는 실제 iframe입니다.

## 🎤 스피커 모드(신규)

아무 데크나 누르세요 `S` 키를 누르면 4 ** 드래그 가능을 포함한 독립적인 스피커 창이 나타납니다.
크기 조정 가능한 자기 카드**: 현재 페이지 미리보기, 다음 페이지 미리보기, 그대로, 타이머. 창문 두 개
패스 `BroadcastChannel` 양방향 동기 페이지 넘김.

![스피커 모드 · 자기 카드 4개](docs/readme/presenter-mode.png)

**미리보기가 픽셀 단위로 완벽한 이유:** 각 카드는 `<iframe>`, 로드된 내용은 동일합니다.
데크 HTML 파일**(더 많은 URL 포함) `?preview=N` 매개변수. 런타임이 이를 감지합니다.
매개변수 이후에는 페이지 N만 렌더링되고 모든 크롬은 숨겨집니다. 따라서 미리보기는 뷰어 보기와 정확히 동일합니다.
동일한 CSS, 테마, 글꼴, 뷰포트**, 색상 및 레이아웃이 100% 일관성을 보장합니다.

**부드럽게 부드러운 페이지 넘김(깜박임 없음):** 스피커 창은 `postMessage({type:'preview-goto',
idx:N})` 알림지식 iframe,iframe 단지는전환전환 `.is-active` 클래스  -  **다시 로드하지 마세요.
흰색 화면도 없고 깜박임도 없습니다**.

**축어적 초안 작성의 세 가지 철칙:**
1. **음성 메모가 아닌 신호** — 키워드는 굵게 표시되고 전환 문장은 별도의 단락으로 구분됩니다.
2. **페이지당 150~300단어** — 약 2~3분/페이지 케이던스
3. **문자가 아닌 말로 사용** — "그러므로"가 아닌 "그래서", "해야 한다"가 아닌 "이것"

참조 [`references/presenter-mode.md`](references/presenter-mode.md) 또는 직접 복사
`templates/full-decks/presenter-mode-reveal/` 이 기성 템플릿 – 모든 페이지에 완성됩니다.
150~300단어의 축어적 초안 샘플입니다.

## 한 줄 명령 설치

```bash
npx skills add https://github.com/lewislulu/html-ppt-skill
```

설치 후 AgentSkill을 지원하는 모든 에이전트(Claude Code / Codex / Cursor / OpenClaw 등)
이 기능을 사용하여 PPT를 만들 수 있습니다. 상담원에게 다음과 같이 말하세요.

> "사이버펑크 테마를 활용한 8페이지 기술 공유 슬라이드를 만들어 보세요"
> "이 개요를 투자자 자료 프레젠테이션으로 전환하세요"
> "그림과 텍스트, 9개의 그림, 흰색 배경과 부드러운 스타일로 작은 빨간 책을 만들어보세요"
> "스피커 모드로 제품 공유를 만들어주세요. 축약형 초안을 원합니다"

## 스킬 내용 목록

| | 수량 | 위치 |
|---|---|---|
| 🎤 **스피커 모드** | **신규** | `S` 열쇠 / `?preview=N` |
| 🎨 **테마** | **36** | `assets/themes/*.css` |
| 📑 **전체 데크 템플릿** | **15** | `templates/full-decks/<name>/` |
| 🧩 **단일 페이지 레이아웃** | **31** | `templates/single-page/*.html` |
| ✨ **CSS 애니메이션** | **27** | `assets/animations/animations.css` |
| 품 **캔버스 FX 애니메이션** | **20** | `assets/animations/fx/*.js` |
| 🖼️ **Showcase deck** | 4 | `templates/*-showcase.html` |
| 📸 **인증 스크린샷** | 56 | `scripts/verify-output/` |

### 36개 테마

`minimal-white`,`editorial-serif`,`soft-pastel`,`sharp-mono`,`arctic-cool`,
`sunset-warm`,`catppuccin-latte`,`catppuccin-mocha`,`dracula`,`tokyo-night`,
`nord`,`solarized-light`,`gruvbox-dark`,`rose-pine`,`neo-brutalism`,
`glassmorphism`,`bauhaus`,`swiss-grid`,`terminal-green`,`xiaohongshu-white`,
`rainbow-gradient`,`aurora`,`blueprint`,`memphis-pop`,`cyberpunk-neon`,
`y2k-chrome`,`retro-tv`,`japanese-minimal`,`vaporwave`,`midcentury`,
`corporate-clean`,`academic-paper`,`news-broadcast`,`pitch-deck-vc`,
`magazine-bold`,`engineering-whiteprint`

![36개 테마 · 그 중 8개](docs/readme/themes.png)

각 테마는 순수한 CSS 토큰 파일입니다. 한 줄만 바꾸면 됩니다. `<link>` 전체 데크를 제공할 수 있습니다.
피부를 바꾸세요. 안으로 `templates/theme-showcase.html` 모두 찾아볼 수 있습니다. 각 페이지는 독립적인 iframe을 사용합니다.
스타일이 서로 오염되는 것을 방지하기 위한 렌더링)

![15개의 완전한 데크 템플릿](docs/readme/templates.png)

### 15개의 완전한 데크 템플릿

실제 작품에서 추출한 8가지 시각적 언어, 7가지 범용 장면 비계:

**정제된 버전**
- `xhs-white-editorial` — Xiaohongshu 흰색 배경 잡지 스타일
- `graphify-dark-graph` — 어두운 바닥 + Force-Directed 지식 그래프
- `knowledge-arch-blueprint` — 청사진/아키텍처 스타일
- `hermes-cyber-terminal` — 터미널 사이버펑크 스타일
- `obsidian-claude-gradient` — 보라색 그라데이션 카드
- `testing-safety-alert` — 빨간색/황색 경고 바람
- `xhs-pastel-card` — 부드러운 마카롱 그래픽 및 텍스트
- `dir-key-nav-minimal` — 미니멀한 방향 키

**시나리오 모델**
- `pitch-deck` — 투자자 피치
- `product-launch` — 제품 출시
- `tech-sharing` — 기술 공유
- `weekly-report` — 주간
- `xhs-post` — Little Red Book 사진 및 텍스트(9페이지 3:4)
- `course-module` — 교육 모듈
- **`presenter-mode-reveal`** 🎤 — 전체 공유 템플릿, **각 페이지에는 150-300 단어가 제공됩니다.
  축어적 예시**, 다음을 중심으로 `S` 주요 스피커 모드는 다음을 위해 특별히 설계되었습니다.

각 템플릿은 범위가 지정된 자체 포함 폴더입니다. `.tpl-<name>` CSS이므로 여러 템플릿이 가능합니다.
동시 로딩은 서로를 오염시키지 않습니다. 안으로 `templates/full-decks-index.html` 전체 갤러리를 보실 수 있습니다.

![31개의 단일 페이지 레이아웃](docs/readme/layouts.png)

### 31개의 단일 페이지 레이아웃

cover · toc · section-divider · bullets · two-column · three-column ·
big-quote · stat-highlight · kpi-grid · table · code · diff · terminal ·
flow-diagram · timeline · roadmap · mindmap · comparison · pros-cons ·
todo-checklist · gantt · image-hero · image-grid · chart-bar · chart-line ·
chart-pie · chart-radar · arch-diagram · process-steps · cta · thanks

각 레이아웃에는 실제 샘플 데이터가 포함되어 있으므로 이를 데크에 드래그하여 즉시 효과를 확인하세요.

![실제 템플릿 파일을 통해 자동으로 반복되는 31개의 레이아웃](docs/readme/layouts-live.gif)

*대형 iframe 직접 로딩 `templates/single-page/<name>.html` 파일, 2.8초마다
자동으로 다음 레이아웃으로 전환합니다. *

![애니메이션 47개 · CSS 27개 + Canvas FX 20개](docs/readme/animations.png)

### 27가지 CSS 애니메이션 + 20가지 Canvas FX

**CSS 애니메이션(경량)** — 방향성 페이드인,`rise-in`,`zoom-pop`,`blur-in`,
`glitch-in`,`typewriter`(타자기),`neon-glow`(네온 헤일로),
`shimmer-sweep`(스트리머),`gradient-flow`(그라디언트 흐름),`stagger-list`
(시차적 입학 상장),`counter-up`(디지털 스크롤),`path-draw`(경로 그리기),
`morph-shape`,`parallax-tilt`,`card-flip-3d`,`cube-rotate-3d`,
`page-turn-3d`,`perspective-zoom`,`marquee-scroll`,`kenburns`,
`ripple-reveal`,`spotlight`,…

**Canvas FX(영화 등급)** — `particle-burst`(입자 폭발),`confetti-cannon`
(리본),`firework`(불꽃놀이),`starfield`(별이 빛나는 하늘),`matrix-rain`
(코드 비),`knowledge-graph`(힘 중심 지식 그래프),`neural-net`(신경망
맥박),`constellation`(별자리 연결),`orbit-ring`(궤도 고리),
`galaxy-swirl`(은하 소용돌이),`word-cascade`,`letter-explode`,
`chain-react`,`magnetic-field`,`data-stream`,`gradient-blob`,
`sparkle-trail`,`shockwave`,`typewriter-multi`,`counter-explosion`.
각각은 손으로 쓴 캔버스 모듈입니다. 슬라이드에 들어가면, `fx-runtime.js` 자동 초기화.

## 빠른 시작(수동/설치 후/git clone 후)

```bash
# 에서 base 템플릿새빌드한개 deck
./scripts/new-deck.sh my-talk

# 보기보기모든내용안내용
open templates/theme-showcase.html         # 안전하단 36 테마테마(iframe 격리격리)
open templates/layout-showcase.html        # 안전하단 31 레이아웃레이아웃
open templates/animation-showcase.html     # 안전하단 47 애니효과
open templates/full-decks-index.html       # 안전하단 15 개완료완성 deck

# 사용 headless Chrome 탐색내보내기 PNG
./scripts/render.sh templates/theme-showcase.html
./scripts/render.sh examples/my-talk/index.html 12
```

## 키보드 단축키

```
← → Space PgUp PgDn Home End   넘김페이지
F                               안전화면
S                               열기개발발표발표자창창(자석스냅카드카드템한글)
N                               하단하단 notes 서랍서랍
R                               재설정재설정타이머시간기기(발표발표자창창안)
O                               slide 전체보기그리드그리드
T                               전환전환테마테마(자체애니동기단계로발표발표자창창)
A                               에서현재현재 slide 반복반복발표프롬프트한개애니한글
#/N (URL)                       딥링크로제 N 페이지
?preview=N (URL)                미리보기템한글(단지한글프롬프트한글페이지,숨김숨김 chrome)
```

## 프로젝트 구조

```
html-ppt-skill/
├── SKILL.md                      agent 입구창
├── README.md                     한글한국어 README
├── README.zh-CN.md               본한국어파일
├── references/                   상세한글한국어문서
│   ├── themes.md                 36 테마테마 + 사용사용상황상황
│   ├── layouts.md                31 레이아웃레이아웃
│   ├── animations.md             27 CSS + 20 FX 목록
│   ├── full-decks.md             15 완료완성 deck 템플릿
│   ├── presenter-mode.md         🎤 발표발표자템한글 + 발표원고원고가이드가이드
│   └── authoring-guide.md        완료완성한글한글한글
├── assets/
│   ├── base.css                  공유공유 tokens + 기본기본컴포넌트파일
│   ├── fonts.css                 web 원고글꼴가져오기입구
│   ├── runtime.js                키보드탐색탐색 + 발표발표자템한글 + 전체보기
│   ├── themes/*.css              36 테마테마 token 한국어파일
│   └── animations/
│       ├── animations.css        27 개명명명명 CSS 애니한글
│       ├── fx-runtime.js         진입입구 slide 자체애니초기시작초기화 [data-fx]
│       └── fx/*.js               20 개 Canvas FX 템한글
├── templates/
│   ├── deck.html                 최소샤오건단계템플릿
│   ├── theme-showcase.html       iframe 격리격리의테마테마 tour
│   ├── layout-showcase.html      안전하단 31 레이아웃레이아웃
│   ├── animation-showcase.html   47 애니한글 slide
│   ├── full-decks-index.html     15 deck gallery
│   ├── full-decks/<name>/        15 개 scoped 더페이지 deck 템플릿
│   └── single-page/*.html        31 개레이아웃레이아웃한국어파일(한글프롬프트예시데이터데이터)
├── scripts/
│   ├── new-deck.sh               스캐폴드스캐폴드아키텍처
│   ├── render.sh                 headless Chrome → PNG
│   └── verify-output/            56 장자체테스트캡처이미지
└── examples/demo-deck/           완료완성가능실행실행의프롬프트예시 deck
```

## 디자인 컨셉

- **토큰 기반 디자인 시스템. ** 모든 색상, 둥근 모서리, 그림자, 글꼴 결정은
  `assets/base.css` + 현재 테마 파일에서. 변수를 변경하면 전체 데크가 우아하게 재배열됩니다.
- **Iframe 격리 미리보기. **테마/레이아웃/풀데크의 쇼케이스가 모두 사용되었습니다. `<iframe>`,
  각 미리보기가 사실적이고 독립적인 렌더링인지 확인하세요.
- **제로 빌드. ** 순수 정적 HTML/CSS/JS. webfont/highlight.js/chart.js만
  (선택사항) CDN을 사용합니다.
- **숙련된 디자이너의 경우 기본값입니다. **글꼴 크기 규칙, 간격 리듬, 그라데이션, 카드 처리에는 태도가 있습니다 -
  확실히 "PowerPoint 2006"은 아닙니다.
- **중국어와 영어 이중 언어를 구사하는 일류 시민입니다. ** 노토 산스 SC / 노토 세리프 SC 선 수입품입니다.

## 계약

MIT © 2026 lewis &lt;sudolewis@gmail.com&gt;
