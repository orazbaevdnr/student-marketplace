-- JWT is the only login method. Firebase UIDs are no longer used.
DROP INDEX IF EXISTS uq_users_firebase_uid;
ALTER TABLE users DROP COLUMN firebase_uid;
