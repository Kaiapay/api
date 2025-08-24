#!/bin/bash

npx wrangler secrets-store secret create local --name PRIVY_APP_ID --scopes workers --value "cmel98g0x02u6l40btr617b87"
npx wrangler secrets-store secret create local --name PRIVY_APP_SECRET --scopes workers --value "67R5LAGSUQ5FieLiidhHFS2hDVSseMNH1bkzZRJHUU3TkYTNt44gKFr9oBoGTVGjzPX3z35fY3AyczBmTbZGeAge"
npx wrangler secrets-store secret create local --name FEEPAYER_PK --scopes workers --value "0x9c984711c9f01801a609ba861c4702ffc940655f576bf1dfc06597ebd2aa7212"

