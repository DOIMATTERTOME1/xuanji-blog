# 管理后台数据初始化

这个目录保存动态管理后台所需的数据库结构，不包含任何密码或私密密钥。

正式启用时按顺序执行：

1. 在 Supabase SQL Editor 中运行 `migrations/202609030001_admin_cms.sql`。
2. 运行 `seed.sql` 写入当前网站的默认设置。
3. 在 Supabase Authentication 中创建管理员账号。
4. 把该账号加入 `admin_users`：

```sql
insert into public.admin_users (user_id, email)
select id, email
from auth.users
where email = '替换成管理员邮箱';
```

5. 把项目 URL 和 Publishable key 分别配置为 Vercel 环境变量：
   `PUBLIC_SUPABASE_URL`、`PUBLIC_SUPABASE_PUBLISHABLE_KEY`。

不要把 secret key、service_role key 或密码提交到 GitHub。
