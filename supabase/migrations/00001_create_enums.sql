create type listing_type as enum ('WTB', 'WTS');
create type listing_category as enum ('sealed', 'singles', 'graded', 'accessories');
create type listing_language as enum ('japanese', 'english', 'any');
create type listing_status as enum ('active', 'sold', 'expired', 'removed');
create type report_reason as enum ('scam', 'spam', 'harassment', 'inappropriate', 'other');
create type report_status as enum ('pending', 'reviewed', 'resolved', 'dismissed');
