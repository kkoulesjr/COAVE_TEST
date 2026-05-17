# Security Specification for COAVE Coaching Lab

## Data Invariants
1. `inquiries` can be created by anyone (publicly).
2. `inquiries` can only be read, updated, or deleted by authorized admins.
3. `admins` collection contains a list of authorized admin UIDs. Only existing admins can add new admins (or bootstrapped via rules).
4. `admins` records are read-only for the admin themselves (to verify identity).

## The Dirty Dozen (Test Payloads)
1. **Unauthorized List**: Attempt to list `inquiries` as an unauthenticated user. (Expect: DENIED)
2. **Unauthorized Read**: Attempt to read a specific inquiry as a regular authenticated user (not an admin). (Expect: DENIED)
3. **Inquiry Hijack**: Attempt to update an inquiry's status as a non-admin. (Expect: DENIED)
4. **Malicious Injection**: Attempt to create an inquiry with a 1MB string in the 'name' field. (Expect: DENIED)
5. **Identity Spoofing**: Attempt to create an admin record for yourself if you are not already an admin. (Expect: DENIED)
6. **Inquiry Deletion**: Attempt to delete an inquiry as a non-admin. (Expect: DENIED)
7. **Invalid Status**: Admin tries to set inquiry status to "deleted" (not in enum). (Expect: DENIED)
8. **Missing Fields**: Create inquiry without 'email'. (Expect: DENIED)
9. **Wrong Type**: Create inquiry with 'createdAt' as a string instead of server timestamp. (Expect: DENIED)
10. **Admin Escalation**: Regular user tries to add secondary admin. (Expect: DENIED)
11. **PII Leak**: Unauthenticated user tries to 'get' an inquiry by ID. (Expect: DENIED)
12. **Shadow Field**: Create inquiry with an extra field `isSpam`. (Expect: DENIED)
