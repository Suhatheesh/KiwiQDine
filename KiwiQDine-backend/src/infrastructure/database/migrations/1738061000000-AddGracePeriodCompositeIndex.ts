import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGracePeriodCompositeIndex1738061000000 implements MigrationInterface {
    name = 'AddGracePeriodCompositeIndex1738061000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Add composite index for grace period queries
        // This is safe to run now that the enum value has been committed in the previous migration
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_restaurant_status_grace_period" 
            ON restaurants (status, "gracePeriodEndDate") 
            WHERE status = 'grace_period'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_restaurant_status_grace_period"`);
    }
}
