# Security Specification: Khao Saming Hospital Traditional Thai Medicine System

## Data Invariants
1. Only authenticated hospital staff (using Google Auth/Gmail) can read and write service and financial records.
2. Clinical records (`service_records`) must contain valid patient HN, gender, age, serviceDate, coverageType, and procedureType.
3. Financial records (`financial_records`) must validate transaction types (`income` or `expense`), positive numeric amounts, and bounded string sizes.
4. User profiles (`users/{userId}`) can only be modified by the matching authenticated user or admin (`khaosamingttm@gmail.com`).
5. Malicious payloads containing arbitrary oversized data or unverified anonymous users are denied.

## The Dirty Dozen Payloads Test Matrix
1. **Unauthenticated Read on service_records**: Unauthenticated request -> DENIED.
2. **Unauthenticated Write on financial_records**: Unauthenticated request -> DENIED.
3. **Spoofed User Profile Creation**: Creating `/users/victim_id` with `auth.uid == attacker_id` -> DENIED.
4. **Invalid Transaction Type**: Creating financial record with `type: 'stolen_cash'` -> DENIED.
5. **Negative Financial Amount**: Creating financial record with negative amount -> DENIED.
6. **Oversized String Injection**: Injecting 100KB string into `patientName` -> DENIED.
7. **Invalid Gender Enum**: Creating record with `gender: 'alien'` -> DENIED.
8. **Invalid Procedure Enum**: Creating record with unrecognized procedure string -> DENIED.
9. **Unverified Email Modification**: Write by unverified email provider -> DENIED.
10. **ID Traversal Poisoning**: Accessing path with junk symbols -> DENIED.
11. **Malicious Role Escalation**: Normal staff assigning themselves `role: 'admin'` -> DENIED.
12. **Foreign User Write without Auth**: Arbitrary anonymous client -> DENIED.
