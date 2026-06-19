import { DataSource } from 'typeorm';
import { SubscriptionPlanEntity } from '../entities/subscription-plan.entity';

export class SubscriptionPlanSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const planRepo = this.dataSource.getRepository(SubscriptionPlanEntity);

    // Update premium if needed
    const premium = await planRepo.findOne({ where: { code: 'premium' } });
    if (premium && (premium.order !== 3 || premium.orderLimit !== 100)) {
      await planRepo.update({ code: 'premium' }, { order: 3, orderLimit: 100 });
    }

    // Update basic if needed
    const basic = await planRepo.findOne({ where: { code: 'basic' } });
    if (basic && (basic.order !== 1 || basic.orderLimit !== 20 || basic.priceMonthly !== null 
      || basic.priceYearly !== null || basic.yearlySavingsPercent !== null)) {
      await planRepo.update({ code: 'basic' }, { order: 1, orderLimit: 20, priceMonthly: null, 
        priceYearly: null, yearlySavingsPercent: null });
    }

    // Update pro if needed
    const pro = await planRepo.findOne({ where: { code: 'pro' } });
    if (pro && (pro.order !== 2 || pro.orderLimit !== 50)) {
      await planRepo.update({ code: 'pro' }, { order: 2, orderLimit: 50 });
    }
  }
}
