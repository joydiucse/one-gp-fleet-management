-- CreateTable
CREATE TABLE `vehicle_categories` (
    `id` VARCHAR(32) NOT NULL,
    `seq` INTEGER NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uq_vehicle_category_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fuel_types` (
    `id` VARCHAR(32) NOT NULL,
    `seq` INTEGER NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uq_fuel_type_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicles` (
    `id` VARCHAR(32) NOT NULL,
    `seq` INTEGER NOT NULL,
    `vehicle_number` VARCHAR(64) NOT NULL,
    `category_id` VARCHAR(32) NOT NULL,
    `fuel_type_id` VARCHAR(32) NOT NULL,
    `seat_capacity` INTEGER NOT NULL,
    `partner` VARCHAR(160) NOT NULL,
    `mobile_number` VARCHAR(32) NULL,
    `monthly_fixed_rent` DECIMAL(12, 2) NOT NULL,
    `per_km_rate` DECIMAL(10, 2) NOT NULL,
    `ot_rate` DECIMAL(10, 2) NOT NULL,
    `rent_type` ENUM('Monthly', 'Daily') NULL,
    `personal_usage_bill` DECIMAL(12, 2) NOT NULL,
    `toll_charge` DECIMAL(12, 2) NOT NULL,
    `parking_charge` DECIMAL(12, 2) NOT NULL,
    `startup_fuel_charge` DECIMAL(12, 2) NOT NULL,
    `mobile_bill` DECIMAL(12, 2) NOT NULL,
    `other_charge` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('Active', 'Inactive', 'Maintenance') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uq_vehicle_number`(`vehicle_number`),
    INDEX `ix_vehicle_category`(`category_id`),
    INDEX `ix_vehicle_fuel_type`(`fuel_type_id`),
    INDEX `ix_vehicle_status`(`status`),
    INDEX `ix_vehicle_partner`(`partner`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `drivers` (
    `id` VARCHAR(32) NOT NULL,
    `seq` INTEGER NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `mobile` VARCHAR(32) NOT NULL,
    `mobile_normalized` VARCHAR(32) NOT NULL,
    `license_number` VARCHAR(64) NOT NULL,
    `license_attachment` VARCHAR(255) NOT NULL,
    `nid_number` VARCHAR(64) NOT NULL,
    `nid_attachment` VARCHAR(255) NOT NULL,
    `vendor` VARCHAR(160) NOT NULL,
    `status` ENUM('Active', 'Inactive', 'Suspended') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uq_driver_mobile_normalized`(`mobile_normalized`),
    INDEX `ix_driver_status`(`status`),
    INDEX `ix_driver_vendor`(`vendor`),
    INDEX `ix_driver_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rate_cards` (
    `id` VARCHAR(32) NOT NULL,
    `seq` INTEGER NOT NULL,
    `category_id` VARCHAR(32) NOT NULL,
    `fuel_type_id` VARCHAR(32) NOT NULL,
    `monthly_fixed_rent` DECIMAL(12, 2) NOT NULL,
    `per_km_rate` DECIMAL(10, 2) NOT NULL,
    `ot_rate_per_hour` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uq_rate_card_category_fuel`(`category_id`, `fuel_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(32) NOT NULL,
    `seq` INTEGER NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `description` VARCHAR(500) NULL,
    `status` ENUM('Active', 'Inactive') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uq_role_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `role_id` VARCHAR(32) NOT NULL,
    `permission_key` VARCHAR(64) NOT NULL,

    INDEX `ix_role_permission_key`(`permission_key`),
    PRIMARY KEY (`role_id`, `permission_key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(32) NOT NULL,
    `seq` INTEGER NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `role_id` VARCHAR(32) NOT NULL,
    `status` ENUM('Active', 'Inactive') NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `last_login` VARCHAR(32) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uq_user_email`(`email`),
    INDEX `ix_user_role`(`role_id`),
    INDEX `ix_user_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requisitions` (
    `id` VARCHAR(32) NOT NULL,
    `seq` INTEGER NOT NULL,
    `ticket_id` VARCHAR(64) NOT NULL,
    `requestor_id` VARCHAR(64) NOT NULL,
    `employee_name` VARCHAR(160) NOT NULL,
    `department` VARCHAR(160) NOT NULL,
    `request_date_time` VARCHAR(32) NOT NULL,
    `pickup_location` VARCHAR(500) NOT NULL,
    `destination` VARCHAR(500) NOT NULL,
    `pickup_lat` DECIMAL(10, 7) NULL,
    `pickup_lng` DECIMAL(10, 7) NULL,
    `destination_lat` DECIMAL(10, 7) NULL,
    `destination_lng` DECIMAL(10, 7) NULL,
    `vehicle_id` VARCHAR(32) NULL,
    `vehicle_number` VARCHAR(64) NULL,
    `vehicle_category` VARCHAR(120) NULL,
    `driver_id` VARCHAR(32) NULL,
    `driver_name` VARCHAR(160) NULL,
    `vendor` VARCHAR(160) NULL,
    `approx_trip_start_time` VARCHAR(32) NULL,
    `approx_trip_end_time` VARCHAR(32) NULL,
    `trip_start_time` VARCHAR(32) NULL,
    `trip_end_time` VARCHAR(32) NULL,
    `total_travel_time_minutes` INTEGER NULL,
    `total_distance_km` DECIMAL(12, 2) NULL,
    `trip_status` ENUM('In Progress', 'Started', 'Completed', 'Cancelled', 'Rejected') NOT NULL,
    `flag_missing_start_end_time` BOOLEAN NOT NULL DEFAULT false,
    `flag_missing_distance` BOOLEAN NOT NULL DEFAULT false,
    `flag_vehicle_driver_mismatch` BOOLEAN NOT NULL DEFAULT false,
    `flag_duplicate_ticket_id` BOOLEAN NOT NULL DEFAULT false,
    `flag_gps_data_missing` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ix_requisition_ticket`(`ticket_id`),
    INDEX `ix_requisition_status`(`trip_status`),
    INDEX `ix_requisition_vehicle`(`vehicle_id`),
    INDEX `ix_requisition_driver`(`driver_id`),
    INDEX `ix_requisition_vehicle_number`(`vehicle_number`),
    INDEX `ix_requisition_department`(`department`),
    INDEX `ix_requisition_request_date`(`request_date_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requisition_time_extensions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requisition_id` VARCHAR(32) NOT NULL,
    `seq` INTEGER NOT NULL,
    `extended_at` VARCHAR(32) NOT NULL,
    `previous_end_time` VARCHAR(32) NULL,
    `new_end_time` VARCHAR(32) NOT NULL,
    `note` VARCHAR(1000) NOT NULL,
    `extended_by` VARCHAR(160) NOT NULL,

    INDEX `ix_time_extension_requisition`(`requisition_id`, `seq`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requisition_route_points` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requisition_id` VARCHAR(32) NOT NULL,
    `seq` INTEGER NOT NULL,
    `lat` DECIMAL(10, 7) NOT NULL,
    `lng` DECIMAL(10, 7) NOT NULL,

    INDEX `ix_route_point_requisition`(`requisition_id`, `seq`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` VARCHAR(32) NOT NULL,
    `seq` INTEGER NOT NULL,
    `invoice_number` VARCHAR(64) NOT NULL,
    `vehicle_id` VARCHAR(32) NULL,
    `vehicle_number` VARCHAR(64) NOT NULL,
    `vehicle_category` VARCHAR(120) NOT NULL,
    `partner` VARCHAR(160) NOT NULL,
    `billing_month` CHAR(7) NOT NULL,
    `trip_count` INTEGER NOT NULL,
    `total_bill` DECIMAL(14, 2) NOT NULL,
    `status` ENUM('Draft', 'Pending Approval', 'Approved', 'Paid', 'Rejected') NOT NULL,
    `generated_date` VARCHAR(32) NOT NULL,
    `approved_by` VARCHAR(200) NULL,
    `approved_date` VARCHAR(32) NULL,
    `adjustment_note` VARCHAR(1000) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uq_invoice_number`(`invoice_number`),
    INDEX `ix_invoice_billing_month`(`billing_month`),
    INDEX `ix_invoice_vehicle_month`(`vehicle_number`, `billing_month`),
    INDEX `ix_invoice_status`(`status`),
    INDEX `ix_invoice_vehicle`(`vehicle_id`),
    INDEX `ix_invoice_partner`(`partner`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_charges` (
    `invoice_id` VARCHAR(32) NOT NULL,
    `fixed_rent` DECIMAL(12, 2) NOT NULL,
    `personal_usage_bill` DECIMAL(12, 2) NOT NULL,
    `distance_km` DECIMAL(12, 2) NOT NULL,
    `km_rate` DECIMAL(10, 2) NOT NULL,
    `distance_charge` DECIMAL(12, 2) NOT NULL,
    `ot_hours` DECIMAL(10, 2) NOT NULL,
    `ot_charge` DECIMAL(12, 2) NOT NULL,
    `toll_charge` DECIMAL(12, 2) NOT NULL,
    `parking_charge` DECIMAL(12, 2) NOT NULL,
    `startup_fuel_charge` DECIMAL(12, 2) NOT NULL,
    `mobile_bill` DECIMAL(12, 2) NOT NULL,
    `other_charges` DECIMAL(12, 2) NOT NULL,
    `usage_from` VARCHAR(32) NULL,
    `usage_to` VARCHAR(32) NULL,
    `km_octane` DECIMAL(12, 2) NULL,
    `km_lpg` DECIMAL(12, 2) NULL,
    `km_cng` DECIMAL(12, 2) NULL,
    `km_hybrid` DECIMAL(12, 2) NULL,
    `rate_octane` DECIMAL(10, 2) NULL,
    `rate_lpg` DECIMAL(10, 2) NULL,
    `rate_cng` DECIMAL(10, 2) NULL,
    `rate_hybrid` DECIMAL(10, 2) NULL,
    `driver_da_days` DECIMAL(10, 2) NULL,
    `driver_da_amount` DECIMAL(12, 2) NULL,
    `extra_service_rate` DECIMAL(10, 2) NULL,
    `extra_service_hour` DECIMAL(10, 2) NULL,
    `extra_service_amount` DECIMAL(12, 2) NULL,
    `adjustment_absent` DECIMAL(12, 2) NULL,
    `iftar_bill_rate` DECIMAL(10, 2) NULL,
    `iftar_bill_days` DECIMAL(10, 2) NULL,
    `iftar_bill_amount` DECIMAL(12, 2) NULL,

    PRIMARY KEY (`invoice_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(32) NOT NULL,
    `seq` INTEGER NOT NULL,
    `timestamp` VARCHAR(32) NOT NULL,
    `user` VARCHAR(160) NOT NULL,
    `action` VARCHAR(120) NOT NULL,
    `module` VARCHAR(120) NOT NULL,
    `details` VARCHAR(1000) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ix_audit_log_module`(`module`),
    INDEX `ix_audit_log_seq`(`seq`),
    INDEX `ix_audit_log_user`(`user`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `integration_logs` (
    `id` VARCHAR(32) NOT NULL,
    `seq` INTEGER NOT NULL,
    `timestamp` VARCHAR(32) NOT NULL,
    `direction` ENUM('Inbound', 'Outbound') NOT NULL,
    `payload_type` VARCHAR(120) NOT NULL,
    `reference_id` VARCHAR(120) NOT NULL,
    `status` ENUM('Success', 'Failed', 'Retried') NOT NULL,
    `message` VARCHAR(1000) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ix_integration_log_direction`(`direction`),
    INDEX `ix_integration_log_status`(`status`),
    INDEX `ix_integration_log_reference`(`reference_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `id_sequences` (
    `name` VARCHAR(64) NOT NULL,
    `next_value` INTEGER NOT NULL,

    PRIMARY KEY (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vehicles` ADD CONSTRAINT `fk_vehicle_category` FOREIGN KEY (`category_id`) REFERENCES `vehicle_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicles` ADD CONSTRAINT `fk_vehicle_fuel_type` FOREIGN KEY (`fuel_type_id`) REFERENCES `fuel_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rate_cards` ADD CONSTRAINT `fk_rate_card_category` FOREIGN KEY (`category_id`) REFERENCES `vehicle_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rate_cards` ADD CONSTRAINT `fk_rate_card_fuel_type` FOREIGN KEY (`fuel_type_id`) REFERENCES `fuel_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `fk_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `fk_user_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requisitions` ADD CONSTRAINT `fk_requisition_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requisitions` ADD CONSTRAINT `fk_requisition_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requisition_time_extensions` ADD CONSTRAINT `fk_time_extension_requisition` FOREIGN KEY (`requisition_id`) REFERENCES `requisitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requisition_route_points` ADD CONSTRAINT `fk_route_point_requisition` FOREIGN KEY (`requisition_id`) REFERENCES `requisitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `fk_invoice_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_charges` ADD CONSTRAINT `fk_invoice_charge_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
