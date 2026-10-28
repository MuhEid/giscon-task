import { Migration } from '@mikro-orm/migrations';

export class Migration20261028105319 extends Migration {

  override name = 'Migration20261028105319';

  override up(): void | Promise<void> {
    this.addSql(`create table "project" ("id" serial primary key, "name" varchar(255) not null, "description" text not null, "client" varchar(255) not null, "location" varchar(255) not null, "sector" varchar(255) null, "start_date" date not null, "end_date" date null, "technologies" text[] not null default '{}', "created_at" timestamptz not null, "updated_at" timestamptz not null);`);
    this.addSql(`alter table "project" add constraint "project_end_date_check" check (end_date is null or end_date >= start_date);`);

    this.addSql(`create table "staff" ("id" serial primary key, "name" varchar(255) not null, "job_title" varchar(255) not null, "years_of_experience" int not null, "summary" text not null, "skills" text[] not null default '{}', "email" varchar(255) null, "phone" varchar(255) null, "photo_url" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null);`);
    this.addSql(`alter table "staff" add constraint "staff_email_unique" unique ("email");`);
    this.addSql(`alter table "staff" add constraint "staff_years_of_experience_check" check (years_of_experience >= 0);`);

    this.addSql(`create table "project_assignment" ("staff_id" int not null, "project_id" int not null, "role" varchar(255) not null, "responsibilities" text null, "created_at" timestamptz not null, primary key ("staff_id", "project_id"));`);

    this.addSql(`alter table "project_assignment" add constraint "project_assignment_staff_id_foreign" foreign key ("staff_id") references "staff" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "project_assignment" add constraint "project_assignment_project_id_foreign" foreign key ("project_id") references "project" ("id") on update cascade on delete cascade;`);
  }

}
