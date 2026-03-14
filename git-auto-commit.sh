#!/bin/bash

# Configuration
API_KEY=$ANTHROPIC_API_KEY
TEMP_CONTEXT="git_context.txt"

if [ -z "$API_KEY" ]; then
    echo -e "\033[1;31mError: ANTHROPIC_API_KEY is not set.\033[0m"
    exit 1
fi

# 1. Gather Git Context
echo "--- GATHERING GIT STATE ---"
echo "--- GIT STATUS ---" > $TEMP_CONTEXT
git status >> $TEMP_CONTEXT
echo -e "\n--- GIT DIFF ---" >> $TEMP_CONTEXT
git diff >> $TEMP_CONTEXT

# 2. Prepare Payload
echo "Analyzing changes with Claude..."
CLEAN_CONTEXT=$(cat $TEMP_CONTEXT)
SAFE_PAYLOAD=$(python3 -c '
import json, sys
content = sys.stdin.read()
prompt = f"Analyze this git state. Return ONLY a JSON object with keys: \"branch_name\", \"summary\", \"description\". \n\nIMPORTANT: \"summary\" MUST BE UNDER 50 CHARACTERS. \n\nContext: {content}"
print(json.dumps({
    "model": "claude-haiku-4-5-20251001",
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": prompt}]
}))
' <<EOF
$CLEAN_CONTEXT
EOF
)

# 3. Call Anthropic API
RESPONSE=$(curl -s https://api.anthropic.com/v1/messages \
     -H "x-api-key: $API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d "$SAFE_PAYLOAD")

# 4. Extract and Format
RAW_TEXT=$(echo "$RESPONSE" | jq -r '.content[0].text // empty')
CLEAN_JSON=$(echo "$RAW_TEXT" | sed -n '/{/,/}/p')

BRANCH_NAME=$(echo "$CLEAN_JSON" | jq -r '.branch_name' | tr ' ' '-')
SUMMARY=$(echo "$CLEAN_JSON" | jq -r '.summary')
DESCRIPTION=$(echo "$CLEAN_JSON" | jq -r '.description')

# Force-trim summary to 50 chars
if [ ${#SUMMARY} -gt 50 ]; then
    SUMMARY="${SUMMARY:0:47}..."
fi

# 5. Branch Name Validation
check_branch_exists() {
    local name=$1
    if git rev-parse --verify "$name" >/dev/null 2>&1 || git ls-remote --heads origin "$name" | grep -q "$name"; then
        return 0 # Exists
    else
        return 1 # Does not exist
    fi
}

if check_branch_exists "$BRANCH_NAME"; then
    SUFFIX=$(openssl rand -hex 2)
    NEW_BRANCH="${BRANCH_NAME}-${SUFFIX}"
    echo -e "\033[1;33mNote: Branch '$BRANCH_NAME' exists. Using '$NEW_BRANCH'.\033[0m"
    BRANCH_NAME=$NEW_BRANCH
fi

# 6. Interactive Loop
while true; do
    echo -e "\n\033[1;36m--- PROPOSED GIT ACTIONS ---\033[0m"
    echo -e "\033[1;34mBranch:  \033[0m$BRANCH_NAME"
    echo -e "\033[1;32mSummary: \033[0m$SUMMARY \033[1;30m(${#SUMMARY} chars)\033[0m"
    echo -e "\033[1;33mDetails: \033[0m$DESCRIPTION"
    echo -e "-----------------------------\n"

    read -p "Apply changes? [y]es / [n]o / [e]dit: " CHOICE

    case "$CHOICE" in
        y|Y ) break ;;
        e|E )
            EDIT_FILE="git_proposal.txt"
            echo "BRANCH_NAME=\"$BRANCH_NAME\"" > $EDIT_FILE
            echo "SUMMARY=\"$SUMMARY\"" >> $EDIT_FILE
            echo "DESCRIPTION=\"$DESCRIPTION\"" >> $EDIT_FILE
            ${EDITOR:-nano} $EDIT_FILE
            BRANCH_NAME=$(grep 'BRANCH_NAME=' $EDIT_FILE | cut -d'"' -f2)
            SUMMARY=$(grep 'SUMMARY=' $EDIT_FILE | cut -d'"' -f2)
            DESCRIPTION=$(grep 'DESCRIPTION=' $EDIT_FILE | cut -d'"' -f2)
            rm $EDIT_FILE
            ;;
        * )
            echo "Aborted."
            rm $TEMP_CONTEXT
            exit 1
            ;;
    esac
done

# 7. Execution
echo "Executing Git commands..."
git checkout -b "$BRANCH_NAME"
git add .
git commit -m "$SUMMARY" -m "$DESCRIPTION"
git push -u origin "$BRANCH_NAME"

# 8. Open PR in Browser with Pre-filled Title and Body
REMOTE_URL=$(git config --get remote.origin.url | sed -e 's/git@github.com:/https:\/\/github.com\//' -e 's/\.git$//')

if [[ $REMOTE_URL == *"github.com"* ]]; then
    # URL Encode the Summary and Description for the browser
    # We use python3 for reliable URL encoding
    ENCODED_SUMMARY=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1]))" "$SUMMARY")
    ENCODED_DESCRIPTION=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1]))" "$DESCRIPTION")

    # Construct the deep link
    PR_URL="${REMOTE_URL}/compare/${BRANCH_NAME}?expand=1&title=${ENCODED_SUMMARY}&body=${ENCODED_DESCRIPTION}"
    
    echo -e "\033[1;35mOpening PR URL with pre-filled metadata...\033[0m"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$PR_URL"
    else
        xdg-open "$PR_URL" 2>/dev/null || echo "Please open: $PR_URL"
    fi
fi

rm $TEMP_CONTEXT
echo -e "\n\033[1;32mWorkflow Complete!\033[0m"