#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="$(basename "$PWD")"
MASTER_CONTEXT_DIR="../master-context"
TARGET_DIR="$MASTER_CONTEXT_DIR/projects/$PROJECT_NAME"

echo "== Context Sync Start =="
echo "Project: $PROJECT_NAME"
echo "Master Context: $MASTER_CONTEXT_DIR"
echo "Target: $TARGET_DIR"

if [ ! -d "$MASTER_CONTEXT_DIR/.git" ]; then
  echo "ERROR: master-context repo를 찾을 수 없습니다: $MASTER_CONTEXT_DIR"
  echo "현재 프로젝트와 master-context가 같은 상위 폴더 안에 있는지 확인하세요."
  exit 1
fi

if [ ! -d "AI-Sessions/wiki" ]; then
  echo "ERROR: AI-Sessions/wiki 폴더가 없습니다."
  echo "먼저 ContextHub 템플릿을 프로젝트에 세팅하세요."
  exit 1
fi

echo "== Preparing target directory =="

rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"

cat > "$TARGET_DIR/MIRROR_NOTICE.md" <<EOF
# Mirror Notice

이 폴더는 원본 프로젝트 repo에서 자동 동기화된 ContextHub mirror입니다.

- 원본 프로젝트: \`$PROJECT_NAME\`
- 직접 수정 금지
- 수정은 원본 프로젝트의 \`AI-Sessions/wiki/\`, \`index.md\`, \`log.md\`에서 수행한 뒤 sync-context를 다시 실행하세요.
- \`AI-Sessions/raw/\` 원본 자료는 기본적으로 이 mirror에 포함하지 않습니다.
EOF

echo "== Copying root context files =="

for file in START_HERE.md AGENTS.md CLAUDE.md CHATGPT.md index.md log.md; do
  if [ -f "$file" ]; then
    cp "$file" "$TARGET_DIR/$file"
    echo "Copied: $file"
  else
    echo "Skipped missing file: $file"
  fi
done

if [ -d "prompts" ]; then
  cp -R prompts "$TARGET_DIR/prompts"
  echo "Copied: prompts/"
fi

mkdir -p "$TARGET_DIR/AI-Sessions"
cp -R AI-Sessions/wiki "$TARGET_DIR/AI-Sessions/wiki"
echo "Copied: AI-Sessions/wiki/"

if [ -d "AI-Sessions/conversations/handoffs" ]; then
  mkdir -p "$TARGET_DIR/AI-Sessions/conversations"
  cp -R AI-Sessions/conversations/handoffs "$TARGET_DIR/AI-Sessions/conversations/handoffs"
  echo "Copied: AI-Sessions/conversations/handoffs/"
fi

cat > "$TARGET_DIR/sync_meta.md" <<EOF
# Sync Meta

- Project: $PROJECT_NAME
- Synced At: $(date "+%Y-%m-%d %H:%M:%S")
- Source Path: $(pwd)
- Included:
  - START_HERE.md
  - AGENTS.md
  - CLAUDE.md
  - CHATGPT.md
  - index.md
  - log.md
  - prompts/
  - AI-Sessions/wiki/
  - AI-Sessions/conversations/handoffs/ if exists
- Excluded:
  - AI-Sessions/raw/
  - AI-Sessions/raw-private/
  - .env
  - secrets / tokens / passwords
EOF

echo "== Committing to master-context =="

cd "$MASTER_CONTEXT_DIR"

git pull --rebase

git add "projects/$PROJECT_NAME"

if git diff --cached --quiet; then
  echo "No context changes to commit."
else
  git commit -m "sync context: $PROJECT_NAME"
  git push
  echo "Pushed master-context update."
fi

echo "== Context Sync Complete =="