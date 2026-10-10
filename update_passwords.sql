USE jewelbankers_users;
UPDATE users SET password = '$2a$10$2rjBfMWZihJWcPY90yGp6O6dgQ4c/lGz0cgJYM/neiKg7SOvW5YnK' WHERE username = 'Roshan';
UPDATE users SET password = '$2a$10$2rjBfMWZihJWcPY90yGp6O6dgQ4c/lGz0cgJYM/neiKg7SOvW5YnK' WHERE username = 'jewelbankers';
SELECT id, username, password FROM users WHERE username IN ('Roshan', 'jewelbankers');
