import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration: Add Grace Period Support to Restaurants
 * 
 * This migration adds grace period functionality to the restaurants table:
 * 1. Updates the status enum to include 'grace_period'
 * 2. Adds gracePeriodStartDate column
 * 3. Adds gracePeriodEndDate column
 * 
 * Grace Period System:
 * - When a subscription expires with unpaid invoices, restaurant enters grace period
 * - Grace period duration is configurable (default: 2 days)
 * - If invoices are paid during grace period, restaurant returns to active status
 * - If grace period expires with unpaid invoices, restaurant is archived (inactive)
 * 
 * Status Lifecycle: ACTIVE → GRACE_PERIOD → INACTIVE (archived)
 */
export class AddGracePeriodToRestaurants1738060800000 implements MigrationInterface {
  name = 'AddGracePeriodToRestaurants1738060800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add new columns for grace period tracking
    await queryRunner.addColumn(
      'restaurants',
      new TableColumn({
        name: 'gracePeriodStartDate',
        type: 'date',
        isNullable: true,
        comment: 'Date when grace period started (YYYY-MM-DD format)',
      }),
    );

    await queryRunner.addColumn(
      'restaurants',
      new TableColumn({
        name: 'gracePeriodEndDate',
        type: 'date',
        isNullable: true,
        comment: 'Date when grace period will end (YYYY-MM-DD format)',
      }),
    );

    // Step 2: Update status enum to include 'grace_period'
    // First, we need to check if the column uses an enum type or varchar
    // For PostgreSQL, we'll alter the type constraint

    // Drop existing check constraint if it exists
    await queryRunner.query(`
      ALTER TABLE restaurants 
      DROP CONSTRAINT IF EXISTS "CHK_restaurant_status"
    `);

    // Update the status column type to include grace_period
    // Using ALTER TYPE for PostgreSQL enum
    await queryRunner.query(`
      DO $$ 
      BEGIN
        -- Check if the type is an enum
        IF EXISTS (
          SELECT 1 FROM pg_type 
          WHERE typname = 'restaurants_status_enum'
        ) THEN
          -- Add new value to enum if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'grace_period' 
            AND enumtypid = (
              SELECT oid FROM pg_type WHERE typname = 'restaurants_status_enum'
            )
          ) THEN
            ALTER TYPE restaurants_status_enum ADD VALUE 'grace_period';
          END IF;
        ELSE
          -- If it's a varchar, add a check constraint
          ALTER TABLE restaurants 
          ADD CONSTRAINT "CHK_restaurant_status" 
          CHECK (status IN ('active', 'inactive', 'grace_period'));
        END IF;
      END $$;
    `);

    // Step 3: Add index on status for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_restaurant_status" 
      ON restaurants (status)
    `);

    // Step 4: Add index on gracePeriodEndDate for cron job efficiency
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_restaurant_grace_period_end_date" 
      ON restaurants ("gracePeriodEndDate") 
      WHERE "gracePeriodEndDate" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_restaurant_status_grace_period"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_restaurant_grace_period_end_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_restaurant_status"`);

    // Step 2: Update any restaurants in grace_period status to inactive
    await queryRunner.query(`
      UPDATE restaurants 
      SET status = 'inactive' 
      WHERE status = 'grace_period'
    `);

    // Step 3: Remove grace_period from enum (PostgreSQL)
    // Note: PostgreSQL doesn't support removing enum values directly
    // We'll need to recreate the enum without grace_period
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type 
          WHERE typname = 'restaurants_status_enum'
        ) THEN
          -- Create new enum without grace_period
          CREATE TYPE restaurants_status_enum_new AS ENUM ('active', 'inactive');
          
          -- Update column to use new enum
          ALTER TABLE restaurants 
          ALTER COLUMN status TYPE restaurants_status_enum_new 
          USING status::text::restaurants_status_enum_new;
          
          -- Drop old enum
          DROP TYPE restaurants_status_enum;
          
          -- Rename new enum to original name
          ALTER TYPE restaurants_status_enum_new RENAME TO restaurants_status_enum;
        ELSE
          -- If it's a varchar with check constraint, update the constraint
          ALTER TABLE restaurants 
          DROP CONSTRAINT IF EXISTS "CHK_restaurant_status";
          
          ALTER TABLE restaurants 
          ADD CONSTRAINT "CHK_restaurant_status" 
          CHECK (status IN ('active', 'inactive'));
        END IF;
      END $$;
    `);

    // Step 4: Drop grace period columns
    await queryRunner.dropColumn('restaurants', 'gracePeriodEndDate');
    await queryRunner.dropColumn('restaurants', 'gracePeriodStartDate');
  }
}
