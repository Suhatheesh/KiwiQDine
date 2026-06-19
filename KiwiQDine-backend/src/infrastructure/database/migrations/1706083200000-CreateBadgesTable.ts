import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBadgesTable1706083200000 implements MigrationInterface {
  name = 'CreateBadgesTable1706083200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "badges" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "restaurantId" UUID NOT NULL,
        "name" VARCHAR NOT NULL,
        "code" VARCHAR NOT NULL,
        "description" VARCHAR,
        "icon" VARCHAR,
        "backgroundColor" VARCHAR DEFAULT '#FF5722',
        "textColor" VARCHAR DEFAULT '#FFFFFF',
        "displayOrder" INTEGER DEFAULT 0,
        "isActive" BOOLEAN DEFAULT true,
        "isSystem" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        CONSTRAINT "fk_badges_restaurant" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_badges_restaurant" ON "badges"("restaurantId")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_badges_restaurant_code" ON "badges"("restaurantId", "code")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_badges_restaurant_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_badges_restaurant"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "badges"`);
  }
}
