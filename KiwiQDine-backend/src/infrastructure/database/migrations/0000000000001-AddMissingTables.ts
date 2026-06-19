import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingTables0000000000001 implements MigrationInterface {
    name = 'AddMissingTables0000000000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create ENUM types
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "subscription_plan_enum" AS ENUM('basic', 'pro', 'enterprise');
            EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "restaurant_subscription_status_enum" AS ENUM('active', 'expired', 'cancelled');
            EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "billing_cycle_enum" AS ENUM('monthly', 'yearly');
            EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "order_usage_status_enum" AS ENUM('active', 'expired', 'cancelled');
            EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "invoice_type_enum" AS ENUM('subscription', 'overage', 'one_time');
            EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "singleclient_role_enum" AS ENUM('USER', 'ADMIN', 'SUPER_ADMIN');
            EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "singleclient_status_enum" AS ENUM('onBoarding', 'active', 'inactive');
            EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "order_status_type_enum" AS ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');
            EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "order_manager_role_enum" AS ENUM('1', '2', '3');
            EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "food_court_carts_ordertype_enum" AS ENUM('takeaway', 'dine_in', 'parking');
            EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "order_action_enum" AS ENUM(
                    'created', 'confirmed', 'preparing', 'ready', 'served', 'completed',
                    'cancelled', 'on_hold', 'released', 'viewed', 'updated', 'payment_processed', 'deleted',
                    'qr_scanned', 'menu_viewed', 'item_viewed', 'cart_action', 'search',
                    'login', 'logout', 'menu_modified', 'restaurant_modified', 'staff_management', 'settings_changed'
                );
            EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);

        // Create subscriptions table (tenant subscriptions)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "subscriptions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" uuid NOT NULL,
                "plan" "subscription_plan_enum" NOT NULL,
                "startDate" TIMESTAMP NOT NULL,
                "endDate" TIMESTAMP NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscriptions_tenantId" ON "subscriptions" ("tenantId")`);

        // Create order_usage table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "order_usage" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "restaurantId" uuid NOT NULL,
                "month" varchar(7) NOT NULL,
                "status" "order_usage_status_enum" NOT NULL DEFAULT 'active',
                "totalOrders" integer NOT NULL DEFAULT 0,
                "totalUserCount" integer NOT NULL DEFAULT 0,
                "totalTableCount" integer NOT NULL DEFAULT 0,
                "totalQRCount" integer NOT NULL DEFAULT 0,
                "planId" uuid,
                "overageCount" integer NOT NULL DEFAULT 0,
                "overageUserCount" integer NOT NULL DEFAULT 0,
                "overageTableCount" integer NOT NULL DEFAULT 0,
                "overageQRCount" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_order_usage" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_order_usage_restaurantId_month" ON "order_usage" ("restaurantId", "month")`);

        // Create restaurant_subscriptions table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "restaurant_subscriptions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "restaurantId" uuid NOT NULL,
                "planId" uuid NOT NULL,
                "startDate" date NOT NULL,
                "endDate" date,
                "billingCycle" "billing_cycle_enum" NOT NULL DEFAULT 'monthly',
                "isAutoRenew" boolean NOT NULL DEFAULT true,
                "status" "restaurant_subscription_status_enum" NOT NULL DEFAULT 'active',
                "isAutoAssigned" boolean NOT NULL DEFAULT false,
                "usageId" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_restaurant_subscriptions" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_restaurant_subscriptions_restaurantId_status" ON "restaurant_subscriptions" ("restaurantId", "status")`);

        // Create invoice table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "invoice" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "invoiceName" varchar(32) NOT NULL,
                "restaurantId" uuid NOT NULL,
                "planId" uuid,
                "restaurantSubscriptionId" uuid,
                "type" "invoice_type_enum" NOT NULL DEFAULT 'subscription',
                "billing_period" varchar(32) NOT NULL,
                "billing_period_start" date,
                "billing_period_end" date,
                "amount" decimal(10,2) NOT NULL,
                "base_amount" decimal(10,2) NOT NULL,
                "fees" decimal(10,2) NOT NULL,
                "status" varchar(16) NOT NULL DEFAULT 'pending',
                "due_date" date NOT NULL,
                "paid_date" date,
                "invoiceAttachmentUrl" varchar,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_invoice" PRIMARY KEY ("id")
            )
        `);

        // Create transactions table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "transactions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "restaurant_id" varchar(50) NOT NULL,
                "invoice_id" varchar(50) NOT NULL,
                "amount" decimal(12,2) NOT NULL,
                "date" date NOT NULL,
                "description" varchar(255),
                "status" varchar(30) NOT NULL DEFAULT 'pending',
                "type" varchar(30) NOT NULL DEFAULT 'payout',
                "attachmentUrl" varchar,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_transactions" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_transactions_id" ON "transactions" ("id")`);

        // Create bank_details table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "bank_details" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "restaurantId" uuid NOT NULL,
                "bankName" varchar,
                "accountName" varchar,
                "accountNumber" varchar,
                "branch" varchar,
                "iban" varchar,
                "swiftCode" varchar,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_bank_details" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_bank_details_restaurantId" ON "bank_details" ("restaurantId")`);

        // Create customer_ratings table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "customer_ratings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "customerId" uuid NOT NULL,
                "restaurantId" uuid NOT NULL,
                "orderId" uuid,
                "rating" integer NOT NULL,
                "comment" text,
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_customer_ratings" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_customer_ratings_customerId" ON "customer_ratings" ("customerId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_customer_ratings_restaurantId" ON "customer_ratings" ("restaurantId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_customer_ratings_orderId" ON "customer_ratings" ("orderId")`);

        // Create singleclients table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "singleclients" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "auditCreatedDateTime" TIMESTAMP NOT NULL DEFAULT now(),
                "auditCreatedBy" varchar NOT NULL DEFAULT 'system',
                "auditModifiedBy" varchar,
                "auditModifiedDateTime" TIMESTAMP DEFAULT now(),
                "auditDeletedBy" varchar,
                "auditDeletedDateTime" TIMESTAMP,
                "firstName" varchar,
                "lastName" varchar,
                "email" varchar NOT NULL,
                "organisationName" varchar,
                "organisationAddress" varchar,
                "phoneNumber" varchar,
                "passwordHash" varchar NOT NULL,
                "role" "singleclient_role_enum" NOT NULL DEFAULT 'USER',
                "isActive" boolean NOT NULL DEFAULT false,
                "status" "singleclient_status_enum" NOT NULL DEFAULT 'onBoarding',
                "refreshTokenHash" varchar,
                CONSTRAINT "UQ_singleclients_email" UNIQUE ("email"),
                CONSTRAINT "PK_singleclients" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_singleclients_email" ON "singleclients" ("email")`);

        // Create items table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "auditCreatedDateTime" TIMESTAMP NOT NULL DEFAULT now(),
                "auditCreatedBy" varchar NOT NULL DEFAULT 'system',
                "auditModifiedBy" varchar,
                "auditModifiedDateTime" TIMESTAMP DEFAULT now(),
                "auditDeletedBy" varchar,
                "auditDeletedDateTime" TIMESTAMP,
                "name" varchar NOT NULL,
                "description" varchar,
                "price" decimal(10,2) NOT NULL,
                "maximumPermitted" integer NOT NULL,
                "preparationTime" integer,
                CONSTRAINT "UQ_items_name" UNIQUE ("name"),
                CONSTRAINT "PK_items" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_items_name" ON "items" ("name")`);

        // Create locations table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "locations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "auditCreatedDateTime" TIMESTAMP NOT NULL DEFAULT now(),
                "auditCreatedBy" varchar NOT NULL DEFAULT 'system',
                "auditModifiedBy" varchar,
                "auditModifiedDateTime" TIMESTAMP DEFAULT now(),
                "auditDeletedBy" varchar,
                "auditDeletedDateTime" TIMESTAMP,
                "address" varchar NOT NULL,
                "address2" varchar,
                "city" varchar NOT NULL,
                "country" varchar NOT NULL,
                "postCode" varchar NOT NULL,
                "state" varchar NOT NULL,
                "latitude" varchar,
                "longitude" varchar,
                CONSTRAINT "PK_locations" PRIMARY KEY ("id")
            )
        `);

        // Create order_statuses table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "order_statuses" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "auditCreatedDateTime" TIMESTAMP NOT NULL DEFAULT now(),
                "auditCreatedBy" varchar NOT NULL DEFAULT 'system',
                "auditModifiedBy" varchar,
                "auditModifiedDateTime" TIMESTAMP DEFAULT now(),
                "auditDeletedBy" varchar,
                "auditDeletedDateTime" TIMESTAMP,
                "isActive" boolean NOT NULL DEFAULT true,
                "code" varchar NOT NULL,
                "name" varchar NOT NULL,
                "description" varchar,
                "orderId" uuid,
                "status" "order_status_type_enum",
                "notes" varchar,
                "updatedBy" varchar,
                CONSTRAINT "UQ_order_statuses_code" UNIQUE ("code"),
                CONSTRAINT "PK_order_statuses" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_order_statuses_code" ON "order_statuses" ("code")`);

        // Create order_processing_queues table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "order_processing_queues" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "auditCreatedDateTime" TIMESTAMP NOT NULL DEFAULT now(),
                "auditCreatedBy" varchar NOT NULL DEFAULT 'system',
                "auditModifiedBy" varchar,
                "auditModifiedDateTime" TIMESTAMP DEFAULT now(),
                "auditDeletedBy" varchar,
                "auditDeletedDateTime" TIMESTAMP,
                "orderStatusId" uuid NOT NULL,
                "orderId" uuid NOT NULL,
                CONSTRAINT "PK_order_processing_queues" PRIMARY KEY ("id")
            )
        `);

        // Create order_notes table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "order_notes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "auditCreatedDateTime" TIMESTAMP NOT NULL DEFAULT now(),
                "auditCreatedBy" varchar NOT NULL DEFAULT 'system',
                "auditModifiedBy" varchar,
                "auditModifiedDateTime" TIMESTAMP DEFAULT now(),
                "auditDeletedBy" varchar,
                "auditDeletedDateTime" TIMESTAMP,
                "note" varchar NOT NULL,
                "orderId" uuid NOT NULL,
                "menuId" uuid NOT NULL,
                CONSTRAINT "PK_order_notes" PRIMARY KEY ("id")
            )
        `);

        // Create order_managers table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "order_managers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "auditCreatedDateTime" TIMESTAMP NOT NULL DEFAULT now(),
                "auditCreatedBy" varchar NOT NULL DEFAULT 'system',
                "auditModifiedBy" varchar,
                "auditModifiedDateTime" TIMESTAMP DEFAULT now(),
                "auditDeletedBy" varchar,
                "auditDeletedDateTime" TIMESTAMP,
                "firstName" varchar NOT NULL,
                "lastName" varchar NOT NULL,
                "email" varchar NOT NULL,
                "phoneNumber" varchar,
                "singleclientId" uuid NOT NULL,
                "role" integer NOT NULL DEFAULT 1,
                "password" varchar NOT NULL,
                CONSTRAINT "UQ_order_managers_email" UNIQUE ("email"),
                CONSTRAINT "PK_order_managers" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_order_managers_email" ON "order_managers" ("email")`);

        // Create cart_items table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "cart_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "auditCreatedDateTime" TIMESTAMP NOT NULL DEFAULT now(),
                "auditCreatedBy" varchar NOT NULL DEFAULT 'system',
                "auditModifiedBy" varchar,
                "auditModifiedDateTime" TIMESTAMP DEFAULT now(),
                "auditDeletedBy" varchar,
                "auditDeletedDateTime" TIMESTAMP,
                "menuId" uuid NOT NULL,
                "orderId" uuid NOT NULL,
                "total" decimal(10,2) NOT NULL,
                CONSTRAINT "PK_cart_items" PRIMARY KEY ("id")
            )
        `);

        // Create selected_cart_items table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "selected_cart_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "auditCreatedDateTime" TIMESTAMP NOT NULL DEFAULT now(),
                "auditCreatedBy" varchar NOT NULL DEFAULT 'system',
                "auditModifiedBy" varchar,
                "auditModifiedDateTime" TIMESTAMP DEFAULT now(),
                "auditDeletedBy" varchar,
                "auditDeletedDateTime" TIMESTAMP,
                "cartItemId" uuid NOT NULL,
                "itemId" uuid NOT NULL,
                "menuId" uuid NOT NULL,
                "quantity" integer NOT NULL,
                "price" decimal(10,2) NOT NULL,
                "notes" text,
                CONSTRAINT "PK_selected_cart_items" PRIMARY KEY ("id")
            )
        `);

        // Create food_court_carts table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "food_court_carts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "sessionId" varchar,
                "customerId" uuid,
                "tenantId" uuid NOT NULL,
                "items" jsonb NOT NULL,
                "totalAmount" decimal(10,2) NOT NULL DEFAULT 0,
                "tableId" uuid,
                "tableNo" varchar,
                "qrCodeId" uuid,
                "orderType" "food_court_carts_ordertype_enum",
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_food_court_carts" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_food_court_carts_sessionId" ON "food_court_carts" ("sessionId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_food_court_carts_customerId" ON "food_court_carts" ("customerId")`);

        // Create order_activity_logs table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "order_activity_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "orderId" uuid,
                "restaurantId" uuid,
                "tenantId" uuid,
                "entityId" varchar,
                "action" "order_action_enum" NOT NULL,
                "status" varchar,
                "performedById" uuid,
                "performedByName" varchar,
                "performedByRole" varchar,
                "notes" text,
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_order_activity_logs" PRIMARY KEY ("id")
            )
        `);

        console.log('All missing tables created successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "order_activity_logs" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "food_court_carts" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "selected_cart_items" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "cart_items" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "order_managers" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "order_notes" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "order_processing_queues" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "order_statuses" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "locations" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "items" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "singleclients" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "customer_ratings" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "bank_details" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "transactions" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "invoice" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "restaurant_subscriptions" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "order_usage" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions" CASCADE`);

        // Drop enum types
        await queryRunner.query(`DROP TYPE IF EXISTS "order_action_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "food_court_carts_ordertype_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "order_manager_role_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "order_status_type_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "singleclient_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "singleclient_role_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "invoice_type_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "order_usage_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "billing_cycle_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "restaurant_subscription_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "subscription_plan_enum"`);
    }
}
