import {
    boolean,
    pgEnum,
    pgTable,
    serial,
    text,
    timestamp,
    uuid,
    uniqueIndex,
    integer,
  } from 'drizzle-orm/pg-core'
  
  export const referralStatusEnum = pgEnum('referral_status', [
    'pending',
    'opened',
    'signup_completed',
    'activated',
  ])
  
  export const users = pgTable(
    'users',
    {
      id: uuid('id').defaultRandom().primaryKey(),
      name: text('name').notNull(),
      email: text('email').notNull(),
      passwordHash: text('password_hash').notNull(),
      location: text('location'),
      interestedInCommenting: boolean('interested_in_commenting')
        .notNull()
        .default(false),
      referralCode: text('referral_code').notNull(),
      createdAt: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      uniqueIndex('users_email_idx').on(table.email),
      uniqueIndex('users_referral_code_idx').on(table.referralCode),
    ],
  )
  
  export const referrals = pgTable('referrals', {
    id: uuid('id').defaultRandom().primaryKey(),
    referrerUserId: uuid('referrer_user_id').notNull(),
    referredUserId: uuid('referred_user_id'),
    referralCode: text('referral_code').notNull(),
    status: referralStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  })
  
  export const photos = pgTable('photos', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    imageUrl: text('image_url').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  })
  
  export const comments = pgTable('comments', {
    id: serial('id').primaryKey(),
    photoId: integer('photo_id').notNull(),
    userId: uuid('user_id').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  })