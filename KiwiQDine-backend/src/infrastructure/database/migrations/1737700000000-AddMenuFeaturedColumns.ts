import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMenuFeaturedColumns1737700000000 implements MigrationInterface {
  name = 'AddMenuFeaturedColumns1737700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add isFeatured column
    await queryRunner.query(`
      ALTER TABLE "menus"
      ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN DEFAULT false
    `);

    // Add featuredOrder column
    await queryRunner.query(`
      ALTER TABLE "menus"
      ADD COLUMN IF NOT EXISTS "featuredOrder" INTEGER DEFAULT 0
    `);

    // Add badges column (JSONB array)
    await queryRunner.query(`
      ALTER TABLE "menus"
      ADD COLUMN IF NOT EXISTS "badges" JSONB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "menus" DROP COLUMN IF EXISTS "badges"`);
    await queryRunner.query(`ALTER TABLE "menus" DROP COLUMN IF EXISTS "featuredOrder"`);
    await queryRunner.query(`ALTER TABLE "menus" DROP COLUMN IF EXISTS "isFeatured"`);
  }
}
