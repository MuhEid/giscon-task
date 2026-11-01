import { Migration } from '@mikro-orm/migrations';

export class Migration20261101114012 extends Migration {

  override name = 'Migration20261101114012';

  override up(): void | Promise<void> {
    this.addSql(`alter table "staff" alter column "phone" set not null;`);
    this.addSql(`alter table "staff" add constraint "staff_phone_check" check (btrim(phone) <> '');`);

    this.addSql(`alter table "project_assignment" add "start_date" date null, add "end_date" date null;`);
    this.addSql(`alter table "project_assignment" add constraint "project_assignment_end_date_check" check (end_date is null or start_date is null or end_date >= start_date);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "project_assignment" drop constraint "project_assignment_end_date_check";`);
    this.addSql(`alter table "project_assignment" drop column "start_date", drop column "end_date";`);

    this.addSql(`alter table "staff" drop constraint "staff_phone_check";`);
    this.addSql(`alter table "staff" alter column "phone" drop not null;`);
  }

}
