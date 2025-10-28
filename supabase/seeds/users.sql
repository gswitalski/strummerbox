INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '1ebddc8c-f812-4d07-adb2-dbb739ddce5c', '{"action":"user_signedup","actor_id":"172819f2-39f0-4e51-8ab2-ede83b51f8d8","actor_username":"gswitalski@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-10-28 15:26:13.803314+00', ''),
	('00000000-0000-0000-0000-000000000000', '279c025c-b559-4d55-a578-b2931e9f8997', '{"action":"login","actor_id":"172819f2-39f0-4e51-8ab2-ede83b51f8d8","actor_username":"gswitalski@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-28 15:26:13.808135+00', ''),
	('00000000-0000-0000-0000-000000000000', '4e776b8a-ca2c-43d4-b9ed-8b55cafd752a', '{"action":"login","actor_id":"172819f2-39f0-4e51-8ab2-ede83b51f8d8","actor_username":"gswitalski@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-28 15:26:13.985006+00', '');

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '172819f2-39f0-4e51-8ab2-ede83b51f8d8', 'authenticated', 'authenticated', 'gswitalski@gmail.com', '$2a$10$OSGABVZeuWYZyB6kPggkquZhr1YLOGsQiaMJdfAqYDGaWbI0AzOmC', '2025-10-28 15:26:13.804254+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-10-28 15:26:13.985956+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "172819f2-39f0-4e51-8ab2-ede83b51f8d8", "email": "gswitalski@gmail.com", "display_name": "Grzegorz", "email_verified": true, "phone_verified": false}', NULL, '2025-10-28 15:26:13.79084+00', '2025-10-28 15:26:13.987651+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('172819f2-39f0-4e51-8ab2-ede83b51f8d8', '172819f2-39f0-4e51-8ab2-ede83b51f8d8', '{"sub": "172819f2-39f0-4e51-8ab2-ede83b51f8d8", "email": "gswitalski@gmail.com", "display_name": "Grzegorz", "email_verified": false, "phone_verified": false}', 'email', '2025-10-28 15:26:13.800012+00', '2025-10-28 15:26:13.80005+00', '2025-10-28 15:26:13.80005+00', '254bb5a7-80b4-409f-b77a-282c974ef78a');

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id") VALUES
	('47e4abe3-a665-4465-877b-8a0179cf83c9', '172819f2-39f0-4e51-8ab2-ede83b51f8d8', '2025-10-28 15:26:13.808726+00', '2025-10-28 15:26:13.808726+00', NULL, 'aal1', NULL, NULL, 'Deno/2.1.4 (variant; SupabaseEdgeRuntime/1.69.14)', '172.18.0.11', NULL, NULL),
	('011b745f-c6b6-4da3-ad66-d825dd08a21d', '172819f2-39f0-4e51-8ab2-ede83b51f8d8', '2025-10-28 15:26:13.986005+00', '2025-10-28 15:26:13.986005+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '172.18.0.1', NULL, NULL);

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('47e4abe3-a665-4465-877b-8a0179cf83c9', '2025-10-28 15:26:13.813054+00', '2025-10-28 15:26:13.813054+00', 'password', 'ff1ca1bb-2017-40a8-8b4a-f968c1006ea6'),
	('011b745f-c6b6-4da3-ad66-d825dd08a21d', '2025-10-28 15:26:13.988057+00', '2025-10-28 15:26:13.988057+00', 'password', '1c0294ce-4dcc-46ba-b79b-2b36a5d753a4');

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 1, '7ugm44oa357o', '172819f2-39f0-4e51-8ab2-ede83b51f8d8', false, '2025-10-28 15:26:13.810072+00', '2025-10-28 15:26:13.810072+00', NULL, '47e4abe3-a665-4465-877b-8a0179cf83c9'),
	('00000000-0000-0000-0000-000000000000', 2, 'godiixgqpkg4', '172819f2-39f0-4e51-8ab2-ede83b51f8d8', false, '2025-10-28 15:26:13.986845+00', '2025-10-28 15:26:13.986845+00', NULL, '011b745f-c6b6-4da3-ad66-d825dd08a21d');

INSERT INTO "public"."profiles" ("id", "display_name", "created_at", "updated_at") VALUES
	('172819f2-39f0-4e51-8ab2-ede83b51f8d8', 'Grzegorz', '2025-10-28 15:26:13.876372+00', '2025-10-28 15:26:13.876372+00');


-- SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 2, true);
-- SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);
-- RESET ALL;
