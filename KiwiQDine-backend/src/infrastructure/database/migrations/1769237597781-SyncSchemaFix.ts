import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncSchemaFix1769237597781 implements MigrationInterface {
    name = 'SyncSchemaFix1769237597781'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "badges" DROP CONSTRAINT IF EXISTS "fk_badges_restaurant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_badges_restaurant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_badges_restaurant_code"`);
        await queryRunner.query(`ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "isShowcase" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "displayOrder" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true`);

        // Safely set NOT NULL on menus columns if they exist
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "menus" ALTER COLUMN "isFeatured" SET NOT NULL;
            EXCEPTION WHEN others THEN NULL; END $$;
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "menus" ALTER COLUMN "featuredOrder" SET NOT NULL;
            EXCEPTION WHEN others THEN NULL; END $$;
        `);

        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "features" SET DEFAULT '[]'::jsonb`);

        // Safely handle food_court_carts_ordertype_enum - only if it exists and needs updating
        await queryRunner.query(`
            DO $$ BEGIN
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'food_court_carts_ordertype_enum') THEN
                    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'parking' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'food_court_carts_ordertype_enum')) THEN
                        ALTER TYPE "public"."food_court_carts_ordertype_enum" ADD VALUE 'parking';
                    END IF;
                END IF;
            END $$;
        `);

        // Safely alter badges columns
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "badges" ALTER COLUMN "backgroundColor" SET NOT NULL;
                ALTER TABLE "badges" ALTER COLUMN "textColor" SET NOT NULL;
                ALTER TABLE "badges" ALTER COLUMN "displayOrder" SET NOT NULL;
                ALTER TABLE "badges" ALTER COLUMN "isActive" SET NOT NULL;
                ALTER TABLE "badges" ALTER COLUMN "isSystem" SET NOT NULL;
                ALTER TABLE "badges" ALTER COLUMN "createdAt" SET NOT NULL;
                ALTER TABLE "badges" ALTER COLUMN "updatedAt" SET NOT NULL;
            EXCEPTION WHEN others THEN NULL; END $$;
        `);

        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_5583ade5205557a4988d26430a" ON "badges" ("restaurantId", "code")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_100f440c2ca8e603edbf1d8e90" ON "badges" ("restaurantId")`);

        // Add FK constraint if not exists
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_100f440c2ca8e603edbf1d8e90b') THEN
                    ALTER TABLE "badges" ADD CONSTRAINT "FK_100f440c2ca8e603edbf1d8e90b" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "badges" DROP CONSTRAINT "FK_100f440c2ca8e603edbf1d8e90b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_100f440c2ca8e603edbf1d8e90"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5583ade5205557a4988d26430a"`);
        await queryRunner.query(`ALTER TABLE "badges" ALTER COLUMN "updatedAt" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "badges" ALTER COLUMN "createdAt" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "badges" ALTER COLUMN "isSystem" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "badges" ALTER COLUMN "isActive" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "badges" ALTER COLUMN "displayOrder" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "badges" ALTER COLUMN "textColor" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "badges" ALTER COLUMN "backgroundColor" DROP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."food_court_carts_ordertype_enum_old" AS ENUM('takeaway', 'dine_in')`);
        await queryRunner.query(`ALTER TABLE "food_court_carts" ALTER COLUMN "orderType" TYPE "public"."food_court_carts_ordertype_enum_old" USING "orderType"::"text"::"public"."food_court_carts_ordertype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."food_court_carts_ordertype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."food_court_carts_ordertype_enum_old" RENAME TO "food_court_carts_ordertype_enum"`);
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "features" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "menus" ALTER COLUMN "featuredOrder" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "menus" ALTER COLUMN "isFeatured" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "displayOrder"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "isShowcase"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_badges_restaurant_code" ON "badges" ("code", "restaurantId") `);
        await queryRunner.query(`CREATE INDEX "idx_badges_restaurant" ON "badges" ("restaurantId") `);
        await queryRunner.query(`ALTER TABLE "badges" ADD CONSTRAINT "fk_badges_restaurant" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
