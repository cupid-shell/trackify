-- Trackify Data Migration & Cleanup

-- 1. Update Settings
UPDATE user_settings SET 
  expense_categories = '["Rent", "Utilities & Bills", "Food & Dining", "Transport", "Daily Living", "Education", "Other / Unexpected"]'::jsonb,
  category_budgets = '{"Rent": 3000, "Transport": 500, "Utilities & Bills": 850, "Food & Dining": 3500, "Daily Living": 3000}'::jsonb
WHERE user_id = '2f9ec212-22f9-40b0-a56e-ed67400fb467';

-- 2. Rename existing simple categories
UPDATE transactions SET category = 'Rent' WHERE category = 'Seat Rent';
UPDATE transactions SET category = 'Utilities & Bills' WHERE category = 'Utility Bill';
UPDATE transactions SET category = 'Utilities & Bills' WHERE category = 'Gas Bill (Cylinder)';
UPDATE transactions SET category = 'Daily Living' WHERE category = 'Personal Expenses';
UPDATE transactions SET category = 'Other / Unexpected' WHERE category = 'Other / Miscellaneous';

-- 3. Split grouped transactions
DELETE FROM transactions WHERE id IN ('06dd9d1b-4d9d-4845-9c07-1db13487bf04', '2199ff5d-b446-43a0-8099-c65f826f478f', '2583ece2-8dc2-47d5-b67a-be95599f2a9b', '3b35e41f-23d9-43dc-af99-87a6ffc793f5', '3bc937fd-5583-44d2-a13d-73e009066a1b', '461552e4-fb02-4517-8110-ff3cfe991c1d', '58e65b4f-eee4-4cbf-813f-8e38c540c8d2', '5eefa029-aea9-4943-9ba2-d9685ee89658', '6cd6bbe3-ffab-4bbe-a967-05cc3b30d124', '8c074a7e-18e9-4345-9fdc-f541254616db', '90363c51-4cec-4898-b996-c3e6abe052ba', 'a5045d5c-6340-441e-8c32-197726191fec', 'c0247cb0-b9dd-4f7e-b50d-a9cce7bda3b3', 'c6ec0a80-3c8a-4850-805d-3d6725e2a3b9', 'e4efd145-fef2-4cd5-a06e-4617ab5c7eb1', 'e68f761b-e9b9-4c97-8fa1-cacedcf5fc8a', 'ebcd970e-0503-4640-be23-d243a9e0cfdc', 'edf83aee-4d9e-4c79-a16c-d57e69682736', 'f70fc53a-191f-42ef-8e00-a6f676eae63c');

INSERT INTO transactions (user_id, type, amount, category, date, note, payment_method, created_at) VALUES 
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 15, 'Transport', '2026-04-04', 'Metro', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 15, 'Transport', '2026-04-04', 'Leguna', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 15, 'Transport', '2026-04-04', 'Bus', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 40, 'Daily Living', '2026-05-10', 'C', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 30, 'Daily Living', '2026-05-10', 'Lichie Drink', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 135, 'Daily Living', '2026-04-24', 'Khata 2x', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 135, 'Daily Living', '2026-04-24', 'C', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 40, 'Daily Living', '2026-05-09', 'C', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 100, 'Food & Dining', '2026-05-09', 'Snacks', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 160, 'Food & Dining', '2026-05-09', 'lunch', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 75, 'Daily Living', '2026-04-24', 'Soap', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 75, 'Daily Living', '2026-04-24', 'C', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 40, 'Daily Living', '2026-04-27', 'C', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 30, 'Food & Dining', '2026-04-27', 'Biscuit 2x', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 40, 'Daily Living', '2026-04-13', 'C', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 180, 'Food & Dining', '2026-04-13', 'Biscuit', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 100, 'Food & Dining', '2026-04-07', 'Snacks', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 110, 'Daily Living', '2026-04-07', 'C', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 40, 'Daily Living', '2026-04-11', 'C', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 90, 'Food & Dining', '2026-04-11', 'Cup Doi 2x', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 100, 'Daily Living', '2026-04-18', 'Saral Visit', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 100, 'Daily Living', '2026-04-18', 'Multiplug', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 100, 'Daily Living', '2026-04-18', 'Hanger', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 100, 'Daily Living', '2026-04-18', 'C', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 40, 'Daily Living', '2026-04-29', 'C', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 60, 'Daily Living', '2026-04-29', 'travel', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 120, 'Daily Living', '2026-04-29', 'screwdriver', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 40, 'Daily Living', '2026-04-30', 'C', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 115, 'Daily Living', '2026-04-30', 'Chapata', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 115, 'Daily Living', '2026-04-30', 'DiplomaPowder', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 190, 'Daily Living', '2026-04-30', 'Harpick', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 40, 'Daily Living', '2026-04-28', 'C', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 60, 'Daily Living', '2026-04-28', 'travel', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 100, 'Food & Dining', '2026-04-04', 'Snacks', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 220, 'Daily Living', '2026-04-04', 'Ornaments for prapti', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 40, 'Daily Living', '2026-05-02', 'C', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 86, 'Food & Dining', '2026-05-02', 'Snacks', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 40, 'Daily Living', '2026-05-03', 'C', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 120, 'Food & Dining', '2026-05-03', 'Snacks', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 40, 'Daily Living', '2026-04-17', 'C', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 62, 'Daily Living', '2026-04-17', 'bathroom brush', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 40, 'Daily Living', '2026-04-12', 'C', 'bKash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 30, 'Food & Dining', '2026-04-12', 'Porota 3x', 'bKash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 40, 'Daily Living', '2026-05-04', 'C', 'Cash', '2026-05-14 09:53:41.902735+00'),
('2f9ec212-22f9-40b0-a56e-ed67400fb467', 'expense', 110, 'Food & Dining', '2026-05-04', 'Snacks', 'Cash', '2026-05-14 09:53:41.902735+00');
