#!/bin/bash

# Configuration
API_KEY=$ANTHROPIC_API_KEY
TEMP_CONTEXT="git_context.txt"

if [ -z "$API_KEY" ]; then
    echo -e "\033[1;31mError: ANTHROPIC_API_KEY environment variable is not set.\033[0m"
    exit 1
fi

# 1. Gather Git Context
echo "--- GATHERING GIT STATE ---"
echo "--- GIT STATUS ---" > $TEMP_CONTEXT
git status >> $TEMP_CONTEXT
echo -e "\n--- GIT DIFF ---" >> $TEMP_CONTEXT
git diff >> $TEMP_CONTEXT

# 2. Prepare the payload safely using Python to JSON-encode the string
echo "Analyzing changes with Claude..."
CLEAN_CONTEXT=$(cat $TEMP_CONTEXT)
# This creates a single safely escaped JSON string for the message content
SAFE_PAYLOAD=$(python3 -c '
import json, sys
content = sys.stdin.read()
prompt = f"Analyze this git state and return ONLY a valid JSON object. No conversational filler. JSON keys: \"branch_name\", \"summary\", \"description\". Context: {content}"
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

# 4. Extract Data
# We look for the text inside the first content block
RAW_TEXT=$(echo "$RESPONSE" | jq -r '.content[0].text // empty')

if [ -z "$RAW_TEXT" ]; then
    echo -e "\033[1;31mError: API returned an error or empty response.\033[0m"
    echo "$RESPONSE" | jq .
    rm $TEMP_CONTEXT
    exit 1
fi

# Strip markdown code blocks if Claude adds them
CLEAN_JSON=$(echo "$RAW_TEXT" | sed -n '/{/,/}/p')

BRANCH_NAME=$(echo "$CLEAN_JSON" | jq -r '.branch_name')
SUMMARY=$(echo "$CLEAN_JSON" | jq -r '.summary')
DESCRIPTION=$(echo "$CLEAN_JSON" | jq -r '.description')

# 5. Interactive Loop
while true; do
    echo -e "\n\033[1;36m--- PROPOSED GIT ACTIONS ---\033[0m"
    echo -e "\033[1;34mBranch:  \033[0m$BRANCH_NAME"
    echo -e "\033[1;32mSummary: \033[0m$SUMMARY"
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
            # Re-import edited values
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

# 6. Execution
git checkout -b "$BRANCH_NAME"
git add .
git commit -m "$SUMMARY" -m "$DESCRIPTION"
git push -u origin "$BRANCH_NAME"

rm $TEMP_CONTEXT
echo -e "\n\033[1;32mSuccessfully pushed $BRANCH_NAME!\033[0m"