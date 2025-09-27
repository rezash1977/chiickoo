# حل مشکل Archive Constraint

## مشکل
خطای زیر هنگام آرشیو کردن آگهی‌ها رخ می‌دهد:
```
Error archiving ad: 
{code: '23514', message: 'new row for relation "ads" violates check constraint "ads_status_check"'}
```

## علت مشکل
جدول `ads` دارای یک CHECK constraint به نام `ads_status_check` است که مقدار `'archived'` را قبول نمی‌کند. این constraint فقط مقادیر `'pending'`, `'active'`, `'expired'`, `'rejected'` را پشتیبانی می‌کند.

## راه حل

### روش 1: استفاده از اسکریپت (توصیه شده)

1. **تنظیم متغیرهای محیطی**:
   ```bash
   export SUPABASE_URL="your-supabase-url"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

2. **اجرای اسکریپت حل مشکل**:
   ```bash
   npm run fix:archive
   ```

### روش 2: اجرای مستقیم SQL

اگر اسکریپت کار نکرد، می‌توانید این دستورات SQL را مستقیماً در Supabase SQL Editor اجرا کنید:

```sql
-- Step 1: Drop existing constraint
ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_status_check;

-- Step 2: Add new constraint with archived
ALTER TABLE ads ADD CONSTRAINT ads_status_check 
CHECK (status IN ('pending', 'active', 'expired', 'rejected', 'archived'));

-- Step 3: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ads_status_created_at ON ads(status, created_at);
```

### روش 3: استفاده از Migration کامل

اگر می‌خواهید تمام قابلیت‌های آرشیو را اضافه کنید:

```bash
npm run apply:migration
```

## بررسی حل مشکل

پس از اجرای یکی از روش‌های بالا، می‌توانید با این دستور مشکل را بررسی کنید:

```bash
npm run test:archive
```

## فایل‌های ایجاد شده

1. **`supabase/migrations/001_add_archived_status.sql`** - Migration اصلی
2. **`supabase/migrations/002_rollback_archived_status.sql`** - Migration rollback
3. **`scripts/fix-archive-constraint.js`** - اسکریپت حل مشکل
4. **`scripts/apply-migration.js`** - اسکریپت اجرای migration کامل

## نکات مهم

1. **پیش از اجرا**: از دیتابیس backup بگیرید
2. **Service Role Key**: حتماً از Service Role Key استفاده کنید (نه Anon Key)
3. **تست**: پس از اجرا، یک آگهی را آرشیو کنید تا مطمئن شوید کار می‌کند

## عیب‌یابی

### اگر خطای "exec_sql function not found" دریافت کردید:
این یعنی Supabase شما RPC function برای اجرای SQL ندارد. در این صورت از روش 2 (SQL مستقیم) استفاده کنید.

### اگر خطای permission دریافت کردید:
مطمئن شوید که از Service Role Key استفاده می‌کنید و نه Anon Key.

### اگر constraint قبلاً وجود ندارد:
در این صورت فقط constraint جدید را اضافه کنید:
```sql
ALTER TABLE ads ADD CONSTRAINT ads_status_check 
CHECK (status IN ('pending', 'active', 'expired', 'rejected', 'archived'));
```

## پس از حل مشکل

پس از حل مشکل، سیستم آرشیو به طور کامل کار خواهد کرد:

- ✅ آرشیو خودکار آگهی‌های قدیمی‌تر از یک ماه
- ✅ هشدار قبل از آرشیو (5 روز قبل)
- ✅ قابلیت تمدید آگهی‌های آرشیو شده
- ✅ مدیریت آرشیو در پنل ادمین 