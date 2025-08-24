#!/bin/bash

npx wrangler secrets-store secret create local --name PRIVY_APP_ID --scopes workers --value "cmel98g0x02u6l40btr617b87"
npx wrangler secrets-store secret create local --name PRIVY_APP_SECRET --scopes workers --value "67R5LAGSUQ5FieLiidhHFS2hDVSseMNH1bkzZRJHUU3TkYTNt44gKFr9oBoGTVGjzPX3z35fY3AyczBmTbZGeAge"