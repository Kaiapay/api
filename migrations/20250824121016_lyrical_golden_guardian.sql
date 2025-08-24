ALTER TABLE "transactions" ADD COLUMN "token" text NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "currency";--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "tx_hash_unique" UNIQUE("tx_hash");