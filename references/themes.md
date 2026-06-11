# Themes catalog

Every theme is a short CSS file in `assets/themes/` that overrides tokens
defined in `assets/base.css`. Switch themes by changing the `href` of
`<link id="theme-link">` or by pressing **T** if the deck has a
`data-themes="a,b,c"` attribute on `<body>` or `<html>`.

All themes define the same variables: `--bg`, `--bg-soft`, `--surface`,
`--surface-2`, `--border`, `--text-1/2/3`, `--accent`, `--accent-2/3`,
`--good`, `--warn`, `--bad`, `--grad`, `--grad-soft`, `--radius*`, `--shadow*`,
`--font-sans`, `--font-display`.

## Light & calm

| name | description | when to use |
|---|---|---|
| `minimal-white` | 미니멀리스트 화이트, 절제된 고급형. Inter, 강한 텍스트 수준, 매우 낮은 그림자. | 내부 보고, 일대일 기술 검토, 콘텐츠를 도용하지 않는 심각한 주제 |
| `editorial-serif` | 매거진 스타일의 플레이페어 세리프 + 크림 베이스. | 브랜드 스토리, 촘촘한 텍스트로 구성된 긴 연설 |
| `soft-pastel` | 부드러운 마카롱 3색 그라데이션. | 제품 출시, 소비자 중심, 쉬운 주제 |
| `xiaohongshu-white` | Xiaohongshu 흰색 배경 + 따뜻한 빨간색 액센트 + 세리프 제목. | Little Red Book 그래픽, 생활/미학 콘텐츠 |
| `solarized-light` | 눈부심이 적은 클래식 색상 구성. | 장시간 시청 워크숍, 강의 |
| `catppuccin-latte` | 캣푸친 연한 색. | 개발자와 괴짜 친화적인 기술 공유 |

## Bold & statement

| name | description | when to use |
|---|---|---|
| `sharp-mono` | 퓨어 흑백 + Archivo Black + 하드 섀도우. | 선언문, 매우 영향력 있는 시각적 자료 |
| `neo-brutalism` | 두꺼운 획, 단단한 그림자, 밝은 노란색 액센트. | 과감하게 말하고 행동하는 기업가정신 로드쇼 |
| `bauhaus` | 기하학 + 빨간색, 노란색, 파란색 기본 색상입니다. | 디자인 토크, 미술사/제품 미학 주제 |
| `swiss-grid` | 스위스 그리드 + 헬베티카 느낌 + 12열 셰이딩. | 심각한 조판 및 디자인 산업 |
| `memphis-pop` | 멤피스 팝 배경 + 큰 글꼴 제목. | 젊고 트렌디한 브랜드 제휴 |

## Cool & dark

| name | description | when to use |
|---|---|---|
| `catppuccin-mocha` | 깊은 카푸친. | 개발자간 내부 공유, 장기 시청 |
| `dracula` | 클래식 드라큘라 퍼플 메인 컬러입니다. | 코드집약적 기술공유 |
| `tokyo-night` | 도쿄 나이트 푸른 밤. | 냉기 기술 공유 및 인프라 |
| `nord` | 북유럽의 시원한 파란색과 흰색. | 인프라, 클라우드 제품 |
| `gruvbox-dark` | 따뜻한 빈티지 다크 컬러. | 터미널 / vim / *nix 커뮤니티 |
| `rose-pine` | 장미 소나무, 부드럽고 어두운 색상. | 디자인 + 개발 인터페이스, 미학에서 기술로 |
| `arctic-cool` | 파란색/청록색/슬레이트 회색 빛 버전. | 비즈니스 분석, 금융, 차분하고 합리적인 |

## Warm & vibrant

| name | description | when to use |
|---|---|---|
| `sunset-warm` | 오렌지/코랄/앰버 3가지 컬러 그라데이션. | 라이프 스타일, 수상 경력, 긍정적인 감정 |

## Effect-heavy

| name | description | when to use |
|---|---|---|
| `glassmorphism` | 젖빛 유리 + 다색 별색 배경. | 애플식 기자간담회, 제품특징 전시 |
| `aurora` | 오로라 그라데이션 + 흐림 + 채도. | 표지/CTA/결론 페이지 |
| `rainbow-gradient` | 흰색 배경 + 무지개 흐르는 그라데이션 악센트. | 행복, 축제, 축하 페이지 |
| `blueprint` | 블루프린트 프로젝트 + 그리드 셰이딩 + 몽타주 글꼴. | 시스템 아키텍처, 엔지니어링 청사진 |
| `terminal-green` | 녹색 화면 터미널 + 단일 폭 + 발광 텍스트. | CLI/검은 모자/레트로 펑크 |

## v2 additions

### Light & professional

| name | description | when to use |
|---|---|---|
| `corporate-clean` | 순백색 + 네이비색 악센트 + 인터 + 보수적인 테두리. | 이사회 보고서, B2B 영업, 금융 및 보험 |
| `pitch-deck-vc` | YC 윈드 화이트 베이스 + 파란색과 보라색 그라데이션 액센트 + 넓은 공백. | 파이낸싱 로드쇼, 시드 라운드, VC 미팅 |
| `academic-paper` | 종이 흰색 + 세리프 텍스트 + 검정 잉크 + 파란색 링크. | 학술보고서, 연구공유, 컨퍼런스 논문 |
| `japanese-minimal` | 아이보리 + 주홍색 액센트 + 멋진 여백 + 노토 세리프. | 브랜드 업그레이드, 장인 이야기, 선(한글) 서사 |
| `engineering-whiteprint` | 흰색 배경 + 그래프 용지 그리드 + 남색 잉크 선 + 고정 폭 글꼴. | 시스템 설계, API 문서, 아키텍처 백서 |

### Bold & editorial

| name | description | when to use |
|---|---|---|
| `magazine-bold` | 크림 베이스 + 오버사이즈 플레이페어 라이너 + 오렌지 스팟. | 칼럼기사, 커버스토리, 브랜드월간 |
| `news-broadcast` | 흰색 배경 + 빨간색 세로 막대 + Oswald 대문자 + 하드 그림자. | 속보, 보도자료, 데이터 방송 |
| `midcentury` | 크림 베이스 + 머스타드/그린/번트 오렌지 + 샤프한 지오메트리. | 디자인 역사, 홈 미학, 레트로 브랜드 |
| `retro-tv` | 따뜻한 크림색 + CRT 스캔 라인 + 호박색 주황색 액센트. | 향수를 불러일으키는 서사, 1980년대와 1990년대 테마 |

### Effect-heavy / dramatic

| name | description | when to use |
|---|---|---|
| `cyberpunk-neon` | 퓨어 블랙 + 네온 핑크, 그린 및 옐로우 + 글로우 + JetBrains Mono. | 해커, 언더그라운드 문화, 사이버 토크 |
| `vaporwave` | 딥 퍼플 + 핑크, 시안, 블루 그라데이션 + 얼룩진 밝은 반점. | 음악, 트렌디한 예술, A E S T H E T I C |
| `y2k-chrome` | 실버 크롬 그라데이션 + 무지개 액센트 + 커다란 둥근 모서리 + Space Grotesk. | 밀레니얼 향수, 패션 브랜드, Gen-Z |

## How to apply

```html
<link rel="stylesheet" id="theme-link" href="../assets/themes/aurora.css">
```

Or enable `T`-cycling by listing themes on the body:

```html
<body data-themes="minimal-white,aurora,catppuccin-mocha" data-theme-base="../assets/themes/">
```

## How to extend

Copy an existing theme, rename it, and override only the variables you want to
change. Keep each theme under ~200 lines. Prefer adjusting tokens to adding
new selectors.
