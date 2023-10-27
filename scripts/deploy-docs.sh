#!/bin/bash

curl -sL firebase.tools | bash

cd ./docs
pnpm i
pnpm generate
firebase use --add "$PROJECT_ID"
firebase deploy --only hosting --message "$COMMIT_MESSAGE"
