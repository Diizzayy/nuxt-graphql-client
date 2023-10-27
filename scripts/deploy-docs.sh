#!/bin/bash

curl -sL firebase.tools | bash

cd ./docs
pnpm generate
firebase use --add "$PROJECT_ID" --token "$FIREBASE_TOKEN"
firebase deploy --only hosting --message "$COMMIT_MESSAGE" --token "$FIREBASE_TOKEN"
