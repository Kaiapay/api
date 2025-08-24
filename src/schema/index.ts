import { TxnMethod, TxnStatus, TxnKind, Currency } from "@/utils/enum";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  numeric,
  varchar,
  unique,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // privy id
  kaiapayId: text("kaiapay_id"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    fromAddress: text("from_address").notNull(),
    toAddress: text("to_address").notNull(),

    token: text("token").$type<`0x${string}`>().notNull(),
    amount: numeric("amount", {
      mode: "string",
      precision: 38,
      scale: 0,
    }).notNull(),

    senderAlias: text("sender_alias"), // 송금자 별칭
    recipientAlias: text("recipient_alias"), // 수신자 별칭

    kind: text("kind").$type<TxnKind>().notNull(),
    method: text("method").$type<TxnMethod>().notNull(),
    status: text("status").$type<TxnStatus>().notNull(),

    deadline: timestamp("deadline", { withTimezone: true }), // send_to_temporal 일 경우 설정

    // temporal pot에 보내는 경우 true
    // 상대방이 받았을 경우 false로 업데이트됨
    canCancel: boolean("can_cancel").notNull().default(false),

    txHash: varchar("tx_hash", { length: 80 }),
    cancelTxHash: varchar("cancel_tx_hash", { length: 80 }),

    // UI용 상태 텍스트/메모
    memo: varchar("memo", { length: 200 }),

    paymentId: uuid("payment_id").references(() => payments.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [unique("tx_hash_unique").on(t.txHash)]
);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 15 }).notNull().unique(), // 8pL1aB9xQm7Ez5N

  receiverUserId: text("receiver_user_id").notNull(), // privy id

  title: text("title").notNull(),
  // currency 와 amount 는 최초 생성시 설정되며 변경 불가
  currency: text("currency").$type<Currency>(),
  amount: numeric("amount", {
    mode: "string",
    precision: 38,
    scale: 0,
  }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
