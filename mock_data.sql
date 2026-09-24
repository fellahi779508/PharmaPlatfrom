-- ============================================
-- MOCK DATA FOR ALGERIAN PHARMACY PLATFORM
-- ============================================
-- This script populates the database with:
-- - 5 years of pharmacy curriculum (3 semesters each)
-- - Algerian pharmacy subjects and courses
-- - Mock Algerian students (all activated and verified)
-- - Activated redeem codes with valid expiry dates
-- ============================================

-- IMPORTANT: Run clear_database.sql first to delete existing data
-- The clear script uses TRUNCATE RESTART IDENTITY which resets sequences automatically
-- ============================================



-- ============================================
-- YEARS (5 Years of Pharmacy Program)
-- ============================================
INSERT INTO year (id, name) VALUES
(1, '1ère Année'),
(2, '2ème Année'),
(3, '3ème Année'),
(4, '4ème Année'),
(5, '5ème Année');

-- ============================================
-- SEMESTERS (3 semesters per year)
-- ============================================
INSERT INTO semester (id, number, "yearId") VALUES
-- Year 1
(1, 1, 1),
(2, 2, 1),
(3, 3, 1),
-- Year 2
(4, 1, 2),
(5, 2, 2),
(6, 3, 2),
-- Year 3
(7, 1, 3),
(8, 2, 3),
(9, 3, 3),
-- Year 4
(10, 1, 4),
(11, 2, 4),
(12, 3, 4),
-- Year 5
(13, 1, 5),
(14, 2, 5),
(15, 3, 5);

-- ============================================
-- SUBJECTS (Algerian Pharmacy Curriculum)
-- ============================================
INSERT INTO subject (id, name, "yearId", "createdAt", "updatedAt") VALUES
-- Year 1 Subjects
(1, 'Chimie Générale', 1, NOW(), NOW()),
(2, 'Chimie Organique', 1, NOW(), NOW()),
(3, 'Biologie Cellulaire', 1, NOW(), NOW()),
(4, 'Anatomie Humaine', 1, NOW(), NOW()),
(5, 'Botanique Médicale', 1, NOW(), NOW()),
(6, 'Mathématiques', 1, NOW(), NOW()),
(7, 'Physique', 1, NOW(), NOW()),
(8, 'Informatique', 1, NOW(), NOW()),

-- Year 2 Subjects
(9, 'Chimie Analytique', 2, NOW(), NOW()),
(10, 'Biochimie', 2, NOW(), NOW()),
(11, 'Physiologie', 2, NOW(), NOW()),
(12, 'Microbiologie', 2, NOW(), NOW()),
(13, 'Pharmacognosie', 2, NOW(), NOW()),
(14, 'Chimie Thérapeutique', 2, NOW(), NOW()),

-- Year 3 Subjects
(15, 'Pharmacologie', 3, NOW(), NOW()),
(16, 'Toxicologie', 3, NOW(), NOW()),
(17, 'Chimie Pharmaceutique', 3, NOW(), NOW()),
(18, 'Technologie Pharmaceutique', 3, NOW(), NOW()),
(19, 'Parasitologie', 3, NOW(), NOW()),
(20, 'Mycologie', 3, NOW(), NOW()),

-- Year 4 Subjects
(21, 'Thérapeutique', 4, NOW(), NOW()),
(22, 'Clinique Thérapeutique', 4, NOW(), NOW()),
(23, 'Droit Pharmaceutique', 4, NOW(), NOW()),
(24, 'Économie de la Santé', 4, NOW(), NOW()),
(25, 'Biochimie Clinique', 4, NOW(), NOW()),
(26, 'Hématologie', 4, NOW(), NOW()),

-- Year 5 Subjects
(27, 'Stage Hospitalier', 5, NOW(), NOW()),
(28, 'Stage Officinal', 5, NOW(), NOW()),
(29, 'Pharmacie Clinique', 5, NOW(), NOW()),
(30, 'Recherche Pharmaceutique', 5, NOW(), NOW()),
(31, 'Management Pharmaceutique', 5, NOW(), NOW()),
(32, 'Éthique Pharmaceutique', 5, NOW(), NOW());

-- ============================================
-- COURSES (Linked to subjects and semesters)
-- ============================================
INSERT INTO course (id, name, "subjectId", "semesterId") VALUES
-- Year 1 - Semester 1
(1, 'Introduction à la Chimie Générale', 1, 1),
(2, 'Structure Atomique', 1, 1),
(3, 'Liaisons Chimiques', 1, 1),
(4, 'Introduction à la Biologie Cellulaire', 3, 1),
(5, 'Structure de la Cellule', 3, 1),
(6, 'Anatomie Générale', 4, 1),
(7, 'Introduction à la Botanique', 5, 1),

-- Year 1 - Semester 2
(8, 'Chimie Organique Fondamentale', 2, 2),
(9, 'Fonctions Organiques', 2, 2),
(10, 'Physiologie Cellulaire', 3, 2),
(11, 'Anatomie Systémique', 4, 2),
(12, 'Plantes Médicinales', 5, 2),
(13, 'Calcul Différentiel', 6, 2),

-- Year 1 - Semester 3
(14, 'Thermodynamique', 1, 3),
(15, 'Physique des Solutions', 7, 3),
(16, 'Bureautique Pharmaceutique', 8, 3),
(17, 'Statistiques de Base', 6, 3),
(18, 'Anatomie Organes', 4, 3),
(19, 'Classification Botanique', 5, 3),

-- Year 2 - Semester 1
(20, 'Méthodes de Séparation', 9, 4),
(21, 'Spectroscopie', 9, 4),
(22, 'Biochimie des Protéines', 10, 4),
(23, 'Enzymologie', 10, 4),
(24, 'Physiologie du Système Nerveux', 11, 4),
(25, 'Microbiologie Générale', 12, 4),

-- Year 2 - Semester 2
(26, 'Dosages Chimiques', 9, 5),
(27, 'Biochimie des Glucides', 10, 5),
(28, 'Biochimie des Lipides', 10, 5),
(29, 'Physiologie Cardiovasculaire', 11, 5),
(30, 'Bactériologie', 12, 5),
(31, 'Pharmacognosie Générale', 13, 5),

-- Year 2 - Semester 3
(32, 'Chimie Organique Avancée', 2, 6),
(33, 'Chimie Thérapeutique I', 14, 6),
(34, 'Virologie', 12, 6),
(35, 'Physiologie Digestive', 11, 6),
(36, 'Huiles Essentielles', 13, 6),
(37, 'Analyse Instrumentale', 9, 6),

-- Year 3 - Semester 1
(38, 'Pharmacologie Générale', 15, 7),
(39, 'Pharmacocinétique', 15, 7),
(40, 'Toxicologie Générale', 16, 7),
(41, 'Chimie des Médicaments I', 17, 7),
(42, 'Formes Galéniques Liquides', 18, 7),
(43, 'Parasitologie Médicale', 19, 7),

-- Year 3 - Semester 2
(44, 'Pharmacologie Spéciale', 15, 8),
(45, 'Toxicologie Clinique', 16, 8),
(46, 'Chimie des Médicaments II', 17, 8),
(47, 'Formes Galéniques Solides', 18, 8),
(48, 'Mycologie Médicale', 20, 8),
(49, 'Stérilisation', 12, 8),

-- Year 3 - Semester 3
(50, 'Pharmacologie du Système Nerveux', 15, 9),
(51, 'Toxicologie Analytique', 16, 9),
(52, 'Chimie des Médicaments III', 17, 9),
(53, 'Contrôle Qualité', 18, 9),
(54, 'Parasitologie Tropicale', 19, 9),
(55, 'Antibiotiques', 12, 9),

-- Year 4 - Semester 1
(56, 'Thérapeutique Cardiovasculaire', 21, 10),
(57, 'Thérapeutique Digestive', 21, 10),
(58, 'Clinique Cardiovasculaire', 22, 10),
(59, 'Droit du Médicament', 23, 10),
(60, 'Biochimie des Enzymes', 25, 10),
(61, 'Hématologie Générale', 26, 10),

-- Year 4 - Semester 2
(62, 'Thérapeutique Neurologique', 21, 11),
(63, 'Thérapeutique Endocrinienne', 21, 11),
(64, 'Clinique Respiratoire', 22, 11),
(65, 'Économie Pharmaceutique', 24, 11),
(66, 'Biochimie Hormonale', 25, 11),
(67, 'Hématopathies', 26, 11),

-- Year 4 - Semester 3
(68, 'Thérapeutique Infectieuse', 21, 12),
(69, 'Thérapeutique Cancérologique', 21, 12),
(70, 'Clinique Nutritionnelle', 22, 12),
(71, 'Gestion Officinale', 24, 12),
(72, 'Marqueurs Tumoraux', 25, 12),
(73, 'Transfusion Sanguine', 26, 12),

-- Year 5 - Semester 1
(74, 'Stage Service Médecine', 27, 13),
(75, 'Stage Service Chirurgie', 27, 13),
(76, 'Pharmacie Clinique I', 29, 13),
(77, 'Méthodologie de Recherche', 30, 13),
(78, 'Management de l''Officine', 31, 13),
(79, 'Éthique et Déontologie', 32, 13),

-- Year 5 - Semester 2
(80, 'Stage Service Cardiologie', 27, 14),
(81, 'Stage Laboratoire', 27, 14),
(82, 'Pharmacie Clinique II', 29, 14),
(83, 'Biostatistique Avancée', 30, 14),
(84, 'Marketing Pharmaceutique', 31, 14),
(85, 'Législation Pharmaceutique', 32, 14),

-- Year 5 - Semester 3
(86, 'Stage Service Pédiatrie', 27, 15),
(87, 'Stage Service Urgences', 27, 15),
(88, 'Pharmacie Clinique III', 29, 15),
(89, 'Rédaction Scientifique', 30, 15),
(90, 'Gestion des Stocks', 31, 15),
(91, 'Exercice Professionnel', 32, 15);

-- ============================================
-- USERS (Algerian Pharmacy Students - All Activated & Verified)
-- Passwords are hashed using bcrypt (password: "password123")
-- ============================================
INSERT INTO "user" (id, "firstName", "lastName", username, phone, email, password, "createdAt", "updatedAt", "isActive", "activationDate", "endDate", role, "isVerified", "otpCode", "otpExpiresAt", "aiGenerationCount") VALUES
-- Students from different Algerian cities
('550e8400-e29b-41d4-a716-446655440001', 'Ahmed', 'Benali', 'ahmed.benali', '0550123456', 'ahmed.benali@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0),
('550e8400-e29b-41d4-a716-446655440002', 'Fatima', 'Zerhouni', 'fatima.zerhouni', '0660123456', 'fatima.zerhouni@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0),
('550e8400-e29b-41d4-a716-446655440003', 'Mohamed', 'Kadri', 'mohamed.kadri', '0770123456', 'mohamed.kadri@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0),
('550e8400-e29b-41d4-a716-446655440004', 'Amina', 'Boudiaf', 'amina.boudiaf', '0551123456', 'amina.boudiaf@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0),
('550e8400-e29b-41d4-a716-446655440005', 'Karim', 'Messi', 'karim.messi', '0661123456', 'karim.messi@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0),
('550e8400-e29b-41d4-a716-446655440006', 'Yasmine', 'Brahimi', 'yasmine.brahimi', '0771123456', 'yasmine.brahimi@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0),
('550e8400-e29b-41d4-a716-446655440007', 'Omar', 'Bellar', 'omar.bellar', '0552123456', 'omar.bellar@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0),
('550e8400-e29b-41d4-a716-446655440008', 'Sarah', 'Cherif', 'sarah.cherif', '0662123456', 'sarah.cherif@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0),
('550e8400-e29b-41d4-a716-446655440009', 'Nabil', 'Haddad', 'nabil.haddad', '0772123456', 'nabil.haddad@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0),
('550e8400-e29b-41d4-a716-446655440010', 'Leila', 'Mansouri', 'leila.mansouri', '0553123456', 'leila.mansouri@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0),
('550e8400-e29b-41d4-a716-446655440011', 'Said', 'Amrani', 'said.amrani', '0663123456', 'said.amrani@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0),
('550e8400-e29b-41d4-a716-446655440012', 'Nadia', 'Taleb', 'nadia.taleb', '0773123456', 'nadia.taleb@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0),
('550e8400-e29b-41d4-a716-446655440013', 'Abdelkader', 'Slimani', 'abdelkader.slimani', '0554123456', 'abdelkader.slimani@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0),
('550e8400-e29b-41d4-a716-446655440014', 'Samira', 'Bouazza', 'samira.bouazza', '0664123456', 'samira.bouazza@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0),
('550e8400-e29b-41d4-a716-446655440015', 'Rachid', 'Bounoua', 'rachid.bounoua', '0774123456', 'rachid.bounoua@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0),
('550e8400-e29b-41d4-a716-446655440016', 'Dalila', 'Djelloul', 'dalila.djelloul', '0555123456', 'dalila.djelloul@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0),
('550e8400-e29b-41d4-a716-446655440017', 'Mourad', 'Guessoum', 'mourad.guessoum', '0665123456', 'mourad.guessoum@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0),
('550e8400-e29b-41d4-a716-446655440018', 'Khadija', 'Meziani', 'khadija.meziani', '0775123456', 'khadija.meziani@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0),
('550e8400-e29b-41d4-a716-446655440019', 'Bachir', 'Hammoudi', 'bachir.hammoudi', '0556123456', 'bachir.hammoudi@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0),
('550e8400-e29b-41d4-a716-446655440020', 'Noura', 'Kaddache', 'noura.kaddache', '0666123456', 'noura.kaddache@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW(), true, NOW(), NOW() + INTERVAL '1 year', 'user', true, NULL, NULL, 0);

-- ============================================
-- REDEEM CODES (Activated and linked to users with valid expiry)
-- ============================================
INSERT INTO redeem_code (id, code, "isActivated", "activationDate", "expiryDate", "yearId", "userId") VALUES
-- Year 1 codes
(1, 'PHARM1-ABC123', true, NOW(), NOW() + INTERVAL '1 year', 1, '550e8400-e29b-41d4-a716-446655440001'),
(2, 'PHARM1-DEF456', true, NOW(), NOW() + INTERVAL '1 year', 1, '550e8400-e29b-41d4-a716-446655440002'),
(3, 'PHARM1-GHI789', true, NOW(), NOW() + INTERVAL '1 year', 1, '550e8400-e29b-41d4-a716-446655440003'),
(4, 'PHARM1-JKL012', true, NOW(), NOW() + INTERVAL '1 year', 1, '550e8400-e29b-41d4-a716-446655440004'),

-- Year 2 codes
(5, 'PHARM2-MNO345', true, NOW(), NOW() + INTERVAL '1 year', 2, '550e8400-e29b-41d4-a716-446655440005'),
(6, 'PHARM2-PQR678', true, NOW(), NOW() + INTERVAL '1 year', 2, '550e8400-e29b-41d4-a716-446655440006'),
(7, 'PHARM2-STU901', true, NOW(), NOW() + INTERVAL '1 year', 2, '550e8400-e29b-41d4-a716-446655440007'),
(8, 'PHARM2-VWX234', true, NOW(), NOW() + INTERVAL '1 year', 2, '550e8400-e29b-41d4-a716-446655440008'),

-- Year 3 codes
(9, 'PHARM3-YZA567', true, NOW(), NOW() + INTERVAL '1 year', 3, '550e8400-e29b-41d4-a716-446655440009'),
(10, 'PHARM3-BCD890', true, NOW(), NOW() + INTERVAL '1 year', 3, '550e8400-e29b-41d4-a716-446655440010'),
(11, 'PHARM3-EFG123', true, NOW(), NOW() + INTERVAL '1 year', 3, '550e8400-e29b-41d4-a716-446655440011'),
(12, 'PHARM3-HIJ456', true, NOW(), NOW() + INTERVAL '1 year', 3, '550e8400-e29b-41d4-a716-446655440012'),

-- Year 4 codes
(13, 'PHARM4-KLM789', true, NOW(), NOW() + INTERVAL '1 year', 4, '550e8400-e29b-41d4-a716-446655440013'),
(14, 'PHARM4-NOP012', true, NOW(), NOW() + INTERVAL '1 year', 4, '550e8400-e29b-41d4-a716-446655440014'),
(15, 'PHARM4-QRS345', true, NOW(), NOW() + INTERVAL '1 year', 4, '550e8400-e29b-41d4-a716-446655440015'),
(16, 'PHARM4-TUV678', true, NOW(), NOW() + INTERVAL '1 year', 4, '550e8400-e29b-41d4-a716-446655440016'),

-- Year 5 codes
(17, 'PHARM5-WXY901', true, NOW(), NOW() + INTERVAL '1 year', 5, '550e8400-e29b-41d4-a716-446655440017'),
(18, 'PHARM5-ZAB234', true, NOW(), NOW() + INTERVAL '1 year', 5, '550e8400-e29b-41d4-a716-446655440018'),
(19, 'PHARM5-CDE567', true, NOW(), NOW() + INTERVAL '1 year', 5, '550e8400-e29b-41d4-a716-446655440019'),
(20, 'PHARM5-FGH890', true, NOW(), NOW() + INTERVAL '1 year', 5, '550e8400-e29b-41d4-a716-446655440020');

-- ============================================
-- SAMPLE QCM (Multiple Choice Questions)
-- ============================================
INSERT INTO qcm (id, question, "courseId", "tdId", "tpId") VALUES
(1, 'Quelle est la structure de l''atome de carbone ?', 1, NULL, NULL),
(2, 'Quel est le nombre d''oxydation maximum du carbone ?', 1, NULL, NULL),
(3, 'Quels sont les types de liaisons chimiques ?', 3, NULL, NULL),
(4, 'Quelle est la composition de la membrane cellulaire ?', 4, NULL, NULL),
(5, 'Quel est le rôle des mitochondries ?', 5, NULL, NULL),
(6, 'Quelle est la fonction principale du foie ?', 6, NULL, NULL),
(7, 'Quels sont les types de plantes médicinales ?', 7, NULL, NULL),
(8, 'Quelle est la formule générale des alcanes ?', 8, NULL, NULL),
(9, 'Quels sont les groupes fonctionnels organiques ?', 9, NULL, NULL),
(10, 'Quel est le mécanisme de la respiration cellulaire ?', 10, NULL, NULL);

-- ============================================
-- QCM ANSWERS
-- ============================================
INSERT INTO qcm_answer (id, answer, "isCorrect", explanation, "qcmId") VALUES
-- QCM 1
(1, '6 protons, 6 neutrons, 6 électrons', true, 'Le carbone-12 a 6 protons, 6 neutrons et 6 électrons', 1),
(2, '6 protons, 8 neutrons, 6 électrons', false, 'Ceci correspond au carbone-14', 1),
(3, '8 protons, 6 neutrons, 8 électrons', false, 'Ceci correspond à l''oxygène', 1),
(4, '6 protons, 6 neutrons, 8 électrons', false, 'Nombre d''électrons incorrect', 1),

-- QCM 2
(5, '+4', true, 'Le carbone peut avoir un nombre d''oxydation maximum de +4', 2),
(6, '+2', false, 'Nombre d''oxydation partiel', 2),
(7, '-4', false, 'Nombre d''oxydation minimum', 2),
(8, '0', false, 'État élémentaire', 2),

-- QCM 3
(9, 'Liaison covalente', true, 'Partage d''électrons entre atomes', 3),
(10, 'Liaison ionique', true, 'Transfert d''électrons', 3),
(11, 'Liaison hydrogène', true, 'Attraction dipôle-dipôle', 3),
(12, 'Liaison métallique', true, 'Mer d''électrons', 3),

-- QCM 4
(13, 'Double couche phospholipidique', true, 'Structure fondamentale de la membrane', 4),
(14, 'Simple couche phospholipidique', false, 'Structure incorrecte', 4),
(15, 'Triple couche protéique', false, 'Structure incorrecte', 4),
(16, 'Couche glucidique', false, 'Composant externe seulement', 4),

-- QCM 5
(17, 'Production d''ATP', true, 'Respiration cellulaire', 5),
(18, 'Synthèse des protéines', false, 'Fonction des ribosomes', 5),
(19, 'Stockage d''ADN', false, 'Fonction du noyau', 5),
(20, 'Digestion', false, 'Fonction des lysosomes', 5),

-- QCM 6
(21, 'Détoxification', true, 'Le foie élimine les toxines', 6),
(22, 'Production d''insuline', false, 'Fonction du pancréas', 6),
(23, 'Filtration du sang', false, 'Fonction des reins', 6),
(24, 'Production d''hormones', false, 'Fonction des glandes endocrines', 6),

-- QCM 7
(25, 'Plantes médicinales traditionnelles', true, 'Usage ancestral', 7),
(26, 'Plantes toxiques', false, 'Catégorie différente', 7),
(27, 'Plantes ornementales', false, 'Usage décoratif', 7),
(28, 'Plantes alimentaires', false, 'Usage nutritionnel', 7),

-- QCM 8
(29, 'CnH2n+2', true, 'Formule générale des alcanes', 8),
(30, 'CnH2n', false, 'Formule des alcènes', 8),
(31, 'CnH2n-2', false, 'Formule des alcynes', 8),
(32, 'CnH2n+1OH', false, 'Formule des alcools', 8),

-- QCM 9
(33, 'Groupe hydroxyle (-OH)', true, 'Fonction alcool', 9),
(34, 'Groupe carboxyle (-COOH)', true, 'Fonction acide', 9),
(35, 'Groupe amine (-NH2)', true, 'Fonction amine', 9),
(36, 'Groupe méthyle (-CH3)', false, 'Groupe alkyl, pas fonctionnel', 9),

-- QCM 10
(37, 'Glycolyse + Cycle de Krebs + Chaîne respiratoire', true, 'Processus complet', 10),
(38, 'Glycolyse seulement', false, 'Première étape seulement', 10),
(39, 'Photosynthèse', false, 'Processus des plantes', 10),
(40, 'Fermentation', false, 'Processus anaérobie', 10);

-- ============================================
-- SAMPLE EXAMS
-- ============================================
INSERT INTO exam (id, title, "questionCount", "durationMinutes", "subjectId", "semesterId", "userId", "createdAt", "updatedAt") VALUES
(1, 'Examen Chimie Générale S1', 10, 60, 1, 1, '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
(2, 'Examen Biologie Cellulaire S1', 10, 60, 3, 1, '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
(3, 'Examen Chimie Organique S2', 10, 90, 2, 2, '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
(4, 'Examen Physiologie S2', 10, 60, 11, 5, '550e8400-e29b-41d4-a716-446655440005', NOW(), NOW()),
(5, 'Examen Pharmacologie S1', 10, 90, 15, 7, '550e8400-e29b-41d4-a716-446655440009', NOW(), NOW()),
(6, 'Examen Thérapeutique S1', 10, 90, 21, 10, '550e8400-e29b-41d4-a716-446655440013', NOW(), NOW()),
(7, 'Examen Pharmacie Clinique S1', 10, 60, 29, 13, '550e8400-e29b-41d4-a716-446655440017', NOW(), NOW());

-- ============================================
-- EXAM-QCM RELATIONSHIPS
-- ============================================
INSERT INTO exam_qcm (id, "examId", "qcmId", "order") VALUES
-- Exam 1 - Chimie Générale
(1, 1, 1, 1),
(2, 1, 2, 2),
(3, 1, 3, 3),

-- Exam 2 - Biologie Cellulaire
(4, 2, 4, 1),
(5, 2, 5, 2),

-- Exam 3 - Chimie Organique
(6, 3, 8, 1),
(7, 3, 9, 2),

-- Exam 4 - Physiologie
(8, 4, 6, 1),
(9, 4, 10, 2),

-- Exam 5 - Pharmacologie
(10, 5, 1, 1),
(11, 5, 2, 2),

-- Exam 6 - Thérapeutique
(12, 6, 4, 1),
(13, 6, 5, 2),

-- Exam 7 - Pharmacie Clinique
(14, 7, 6, 1),
(15, 7, 10, 2);

-- ============================================
-- SAMPLE SESSIONS
-- ============================================
INSERT INTO session (id, name, status, "currentQuestionId", "totalQuestions", "correctCount", "userId", "createdAt", "updatedAt") VALUES
(1, 'Session Révision Chimie', 'completed', 3, 3, 2, '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
(2, 'Session Biologie', 'in_progress', 1, 2, 0, '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
(3, 'Session Pharmacologie', 'completed', 2, 2, 1, '550e8400-e29b-41d4-a716-446655440009', NOW(), NOW());

-- ============================================
-- SESSION QUESTIONS
-- ============================================
INSERT INTO session_question (id, "sessionId", "qcmId", position, "isAnswered", "isRevealed", "isCorrect", "answeredAt", "draftAnswerIds") VALUES
-- Session 1
(1, 1, 1, 1, true, true, true, NOW(), NULL),
(2, 1, 2, 2, true, true, false, NOW(), NULL),
(3, 1, 3, 3, true, true, true, NOW(), NULL),

-- Session 2
(4, 2, 4, 1, false, false, NULL, NULL, NULL),
(5, 2, 5, 2, false, false, NULL, NULL, NULL),

-- Session 3
(6, 3, 1, 1, true, true, true, NOW(), NULL),
(7, 3, 2, 2, true, true, false, NOW(), NULL);

-- ============================================
-- SESSION QUESTION ANSWERS
-- ============================================
INSERT INTO session_question_answer (id, "sessionQuestionId", "qcmAnswerId") VALUES
-- Session 1 answers
(1, 1, 1),
(2, 2, 5),
(3, 3, 9),

-- Session 3 answers
(4, 6, 1),
(5, 7, 6);

-- ============================================
-- SAMPLE TODOs
-- ============================================
INSERT INTO todo (id, title, description, status, "userId") VALUES
(1, 'Réviser Chimie Générale', 'Préparer l''examen de chimie générale', false, '550e8400-e29b-41d4-a716-446655440001'),
(2, 'Compléter TD Physiologie', 'Finir les exercices de physiologie', true, '550e8400-e29b-41d4-a716-446655440002'),
(3, 'Réviser Pharmacologie', 'Réviser les médicaments du système nerveux', false, '550e8400-e29b-41d4-a716-446655440009'),
(4, 'Préparer Stage Hospitalier', 'Organiser le stage de 5ème année', false, '550e8400-e29b-41d4-a716-446655440017'),
(5, 'Compléter Mémoire', 'Finaliser le mémoire de recherche', false, '550e8400-e29b-41d4-a716-446655440020');

-- ============================================
-- SAMPLE TASKS
-- ============================================
INSERT INTO task (id, title, description, priority, "startDate", "startTime", "isFinished", "todoId", "createdAt", "updatedAt") VALUES
(1, 'Lire chapitre 1', 'Chimie Générale - Structure atomique', 'high', '2024-09-23', '09:00', true, 1, NOW(), NOW()),
(2, 'Faire exercices 1-5', 'Exercices de liaison chimique', 'medium', '2024-09-24', '14:00', false, 1, NOW(), NOW()),
(3, 'Réviser système nerveux', 'Physiologie du système nerveux central', 'high', '2024-09-25', '10:00', true, 2, NOW(), NOW()),
(4, 'Contacter hôpital', 'Demander les dates de stage', 'high', '2024-09-26', '08:00', false, 4, NOW(), NOW()),
(5, 'Rédiger introduction', 'Introduction du mémoire', 'medium', '2024-09-27', '15:00', false, 5, NOW(), NOW());

-- ============================================
-- SAMPLE EXAM SESSIONS
-- ============================================
INSERT INTO exam_session (id, "examId", "userId", status, "currentQuestionIndex", score, "totalTimeSpent", "startedAt", "completedAt") VALUES
(1, 1, '550e8400-e29b-41d4-a716-446655440001', 'completed', 3, 2, 1800, NOW(), NOW()),
(2, 2, '550e8400-e29b-41d4-a716-446655440002', 'in_progress', 1, 0, 300, NOW(), NULL),
(3, 5, '550e8400-e29b-41d4-a716-446655440009', 'completed', 2, 1, 2700, NOW(), NOW());

-- ============================================
-- SUMMARY
-- ============================================
INSERT INTO summary (id, text) VALUES
(1, 'La chimie générale est fondamentale pour comprendre les propriétés des médicaments. Ce cours couvre la structure atomique, les liaisons chimiques et les réactions de base.'),
(2, 'La biologie cellulaire étudie la structure et les fonctions des cellules, unités fondamentales du vivant. Comprendre les organites cellulaires est essentiel pour la pharmacologie.'),
(3, 'La pharmacologie générale étudie les mécanismes d''action des médicaments, leur absorption, distribution, métabolisme et élimination (ADME).');

-- ============================================
-- UPDATE COURSES WITH SUMMARIES
-- ============================================
UPDATE course SET "summaryId" = 1 WHERE id = 1;
UPDATE course SET "summaryId" = 2 WHERE id = 4;
UPDATE course SET "summaryId" = 3 WHERE id = 38;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Check the data integrity
SELECT 
    'Years' as table_name, COUNT(*) as count FROM year
UNION ALL
SELECT 'Semesters', COUNT(*) FROM semester
UNION ALL
SELECT 'Subjects', COUNT(*) FROM subject
UNION ALL
SELECT 'Courses', COUNT(*) FROM course
UNION ALL
SELECT 'Users', COUNT(*) FROM "user"
UNION ALL
SELECT 'Redeem Codes', COUNT(*) FROM redeem_code
UNION ALL
SELECT 'QCMs', COUNT(*) FROM qcm
UNION ALL
SELECT 'QCM Answers', COUNT(*) FROM qcm_answer
UNION ALL
SELECT 'Exams', COUNT(*) FROM exam
UNION ALL
SELECT 'Sessions', COUNT(*) FROM session
UNION ALL
SELECT 'Todos', COUNT(*) FROM todo
UNION ALL
SELECT 'Tasks', COUNT(*) FROM task;

-- Check user activation status
SELECT 
    username, 
    "isActive", 
    "isVerified", 
    u."activationDate",
    rc.code as redeem_code,
    rc."isActivated" as code_activated,
    rc."expiryDate"
FROM "user" u
LEFT JOIN redeem_code rc ON u.id = rc."userId"
ORDER BY username;

-- ============================================
-- END OF MOCK DATA SCRIPT
-- ============================================
