select cron.unschedule(jobid)
from cron.job
where jobname = 'vitamin-app-meal-reminders';

select cron.schedule(
  'vitamin-app-meal-reminders',
  '* * * * *',
  $job$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'vitamin_project_url'
      ) || '/functions/v1/send-meal-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'vitamin_meal_reminder_cron_secret'
        )
      ),
      body := '{}'::jsonb
    );
  $job$
);
