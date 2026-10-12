-- Inline replies on "Can you help?" requests.
-- Run in the Supabase SQL editor.

-- 1. Replies can now carry a message (null message = the "I can help" flag).
alter table help_replies add column if not exists message text;

-- 2. One member can leave several replies on the same request.
alter table help_replies drop constraint if exists help_replies_help_request_id_member_id_key;

-- 3. Deleting a request removes its replies instead of failing on the FK.
alter table help_replies drop constraint if exists help_replies_help_request_id_fkey;
alter table help_replies add constraint help_replies_help_request_id_fkey
  foreign key (help_request_id) references help_requests(id) on delete cascade;
