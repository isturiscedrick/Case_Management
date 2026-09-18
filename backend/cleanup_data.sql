-- CMI Case Management — pre-deployment data cleanup
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE case_locks;
TRUNCATE TABLE notifications;
TRUNCATE TABLE case_history;
TRUNCATE TABLE decisions;
TRUNCATE TABLE case_causes;
TRUNCATE TABLE case_complainants;
TRUNCATE TABLE cases;
TRUNCATE TABLE complainants;
TRUNCATE TABLE cause_of_actions;

SET FOREIGN_KEY_CHECKS = 1;

SELECT
  (SELECT COUNT(*) FROM cases)              AS cases,
  (SELECT COUNT(*) FROM decisions)          AS decisions,
  (SELECT COUNT(*) FROM case_history)       AS case_history,
  (SELECT COUNT(*) FROM notifications)      AS notifications,
  (SELECT COUNT(*) FROM case_locks)         AS case_locks,
  (SELECT COUNT(*) FROM complainants)       AS complainants,
  (SELECT COUNT(*) FROM cause_of_actions)   AS cause_of_actions,
  (SELECT COUNT(*) FROM companies_reference) AS companies_reference,
  (SELECT COUNT(*) FROM users)              AS users;