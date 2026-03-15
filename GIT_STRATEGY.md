# Git 전략 및 배포 전략

## 브랜치 구조

```
main          ← 프로덕션 (Vercel 자동 배포)
develop       ← 개발 통합 (PR 머지 타겟)
  └─ feature/기능명
  └─ fix/버그명
  └─ hotfix/긴급수정명   ← main에서 직접 분기
```

| 브랜치 | 역할 | 직접 푸시 |
|--------|------|-----------|
| `main` | 프로덕션 | ❌ PR만 허용 |
| `develop` | 개발 통합 | ❌ PR만 허용 |
| `feature/*` | 기능 개발 | ✅ |
| `fix/*` | 버그 수정 | ✅ |
| `hotfix/*` | 긴급 수정 | ✅ |

### 브랜치 네이밍

```
feature/kling-duration-fix
fix/transition-overlap
hotfix/auth-session-expire
```

---

## 배포 전략

| Vercel 환경 | 브랜치 | 설명 |
|------------|--------|------|
| Production | `main` | 프로덕션 자동 배포 |
| Preview | `develop`, `feature/*` 등 | 자동 preview URL 생성 |

- `main` PR 머지 → Vercel 프로덕션 자동 배포
- 환경변수: All Environments 적용

---

## 전체 플로우

```
feature/* → (PR) → develop → (PR) → main → Vercel 프로덕션 배포
                      ↓
               Vercel Preview URL
```

---

## 개발 플로우

### 일반 기능 개발

```bash
# 1. develop 최신화 후 브랜치 생성
git checkout develop
git pull origin develop
git checkout -b feature/기능명

# 2. 작업 후 커밋
git add 파일명
git commit -m "feat: 기능 설명"

# 3. 푸시 (첫 푸시 시 GitHub 브랜치 자동 생성)
git push -u origin feature/기능명

# 4. develop으로 PR 생성
gh pr create --base develop --title "feat: 기능 설명"
```

### 릴리즈 (develop → main)

기능이 충분히 쌓이고 안정적이면 develop을 main으로 머지합니다.

```bash
gh pr create --base main --head develop --title "release: v1.x"
```

### 긴급 핫픽스

```bash
# main에서 직접 분기
git checkout main && git pull origin main
git checkout -b hotfix/버그명

# 수정 후 main으로 PR
git push -u origin hotfix/버그명
gh pr create --base main --title "hotfix: 버그 설명"

# main 머지 후 develop에도 반영
gh pr create --base develop --title "hotfix: develop에 반영"
```

---

## Claude Code 자동 코드 리뷰

### 개요

PR이 생성·업데이트될 때 GitHub Actions가 Claude Code를 실행하여 자동으로 코드 리뷰 코멘트를 달아줍니다.

- **워크플로우 파일**: `.github/workflows/claude-code-review.yml`
- **트리거**: PR `opened`, `synchronize`, `ready_for_review`, `reopened`
- **리뷰 언어**: 한국어

### 동작 방식

```
PR 생성/업데이트
    ↓
GitHub Actions 트리거
    ↓
anthropics/claude-code-action@v1 실행
    ↓
Claude가 PR diff를 읽고 분석
    ↓
gh pr comment 로 리뷰 코멘트 게시
    ↓ (선택적)
mcp__github_inline_comment__create_inline_comment 로 인라인 코멘트 추가
```

### 초기 설치 방법

터미널에서 Claude Code CLI를 실행한 뒤 `/install-github-app` 명령으로 설치했습니다.

```bash
# 1. Claude Code CLI 실행
claude

# 2. CLI 내에서 GitHub App 설치 명령 실행
/install-github-app
```

이 명령이 GitHub App 연결 + 워크플로우 파일(`.github/workflows/claude-code-review.yml`) 생성을 자동으로 처리합니다.

> GitHub App 설치 후 `CLAUDE_CODE_OAUTH_TOKEN` Secret은 별도로 등록해야 합니다 (아래 인증 방식 참고).

### 인증 방식

`claude_code_oauth_token` — Claude Pro 구독 계정의 OAuth 토큰을 사용합니다.

```
GitHub Repository → Settings → Secrets and variables → Actions
→ Secret name: CLAUDE_CODE_OAUTH_TOKEN
→ Value: Claude Pro OAuth 토큰 (claude.ai에서 발급)
```

> API 키 방식(`anthropic_api_key`)도 지원하지만, 이 프로젝트는 Claude Pro 구독 토큰을 사용합니다.

### 허용된 도구 (`--allowedTools`)

보안상 Claude에게 허용된 도구만 명시합니다:

| 도구 | 용도 |
|------|------|
| `Bash(gh pr comment:*)` | PR 최상단에 리뷰 코멘트 게시 |
| `Bash(gh pr diff:*)` | PR의 변경 사항 diff 읽기 |
| `Bash(gh pr view:*)` | PR 메타정보(제목, 설명) 읽기 |
| `mcp__github_inline_comment__create_inline_comment` | 특정 코드 줄에 인라인 코멘트 추가 |

### 워크플로우 파일 전체

```yaml
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]

jobs:
  claude-review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write   # PR 코멘트 작성에 필요
      issues: write
      id-token: write        # OIDC 토큰 (OAuth 인증)

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          prompt: |
            REPO: ${{ github.repository }}
            PR NUMBER: ${{ github.event.pull_request.number }}

            Please review this pull request with a focus on:
            - Code quality and best practices
            - Potential bugs or issues
            - Security implications
            - Performance considerations

            Note: The PR branch is already checked out in the current working directory.

            Use `gh pr comment` for top-level feedback.
            Use `mcp__github_inline_comment__create_inline_comment` (with `confirmed: true`) to highlight specific code issues.
            Always post a review comment regardless of change size. Write the review in Korean.

          claude_args: '--allowedTools "mcp__github_inline_comment__create_inline_comment,Bash(gh pr comment:*),Bash(gh pr diff:*),Bash(gh pr view:*)"'
```

### 주의사항

**워크플로우 파일 수정 시 보안 차단**

`.github/workflows/` 파일을 변경하는 PR은 GitHub 보안 정책에 의해 워크플로우 실행이 차단됩니다. 워크플로우 변경은 `main`에 머지 완료 후 다음 PR부터 반영됩니다.

**플러그인 방식 vs Direct Prompt 방식**

Claude Code GitHub App 마켓플레이스에서 설치하는 플러그인 방식(`/code-review` 명령)은 2026년 초 이후 MCP 툴 로드 실패 문제가 보고되었습니다. 이 프로젝트는 공식 문서([solutions.md](https://github.com/anthropics/claude-code-action/blob/main/docs/solutions.md)) 기준의 **direct prompt 방식**을 사용합니다.
