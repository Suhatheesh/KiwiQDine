import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWalletBalanceToRestaurant1733193600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'restaurants',
      new TableColumn({
        name: 'walletBalance',
        type: 'numeric',
        precision: 12,
        scale: 2,
        default: 0,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('restaurants', 'walletBalance');
  }
}
