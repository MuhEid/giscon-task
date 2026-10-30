import { Migration } from '@mikro-orm/migrations';

export class Migration20261030213553 extends Migration {

  override name = 'Migration20261030213553';

  override up(): void | Promise<void> {
    this.addSql(`alter table "staff" rename column "photo_url" to "photo_path";`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "staff" rename column "photo_path" to "photo_url";`);
  }

}
