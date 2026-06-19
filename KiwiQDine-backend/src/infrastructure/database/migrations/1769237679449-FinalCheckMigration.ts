import { MigrationInterface, QueryRunner } from "typeorm";

export class FinalCheckMigration1769237679449 implements MigrationInterface {
    name = 'FinalCheckMigration1769237679449'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "features" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscription_plans" ALTER COLUMN "features" SET DEFAULT '[]'`);
    }

}
