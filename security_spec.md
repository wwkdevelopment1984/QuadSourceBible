# Security Specification: Cross-Device Verse Annotations

## 1. Data Invariants
1. Every annotation document at `/users/{userId}/annotations/{annotationId}` belongs exclusively to a single verified authenticated user (`request.auth.uid == userId` and `existing.ownerId == request.auth.uid`).
2. `ownerId`, `bookId`, `chapterNumber`, `verseNumber`, and `createdAt` are immutable after document creation.
3. `createdAt` and `updatedAt` MUST match `request.time` (server timestamps only; client-spoofed timestamps are rejected).
4. Document keys must strictly equal the allowed set (`ownerId`, `bookId`, `chapterNumber`, `verseNumber`, `highlightColor`, `noteText`, `textHighlights`, `createdAt`, `updatedAt`); no ghost or shadow fields are permitted.
5. `noteText` is bounded to `<= 5000` chars; `textHighlights` is bounded to `<= 20` items; all IDs match `^[a-zA-Z0-9_\-]+$` with length `<= 128`.
6. Unverified email tokens (`email_verified != true`) and unauthenticated callers have zero read or write access.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Write**: `request.auth == null` attempting `create` at `/users/u1/annotations/JHN_1_1`.
2. **Unverified Email Write**: `request.auth.token.email_verified == false` attempting `create` or `update`.
3. **Cross-User Spoofed Path**: User `u1` attempting to read or write `/users/u2/annotations/JHN_1_1`.
4. **Identity Spoofing in Body**: User `u1` writing `/users/u1/annotations/JHN_1_1` with `ownerId: "u2"`.
5. **Shadow / Ghost Field Injection**: Adding `"isAdmin": true` or `"extraField": "hack"` on `create` or `update`.
6. **Invalid Document ID Poisoning**: Attempting to write `/users/u1/annotations/..%2Fadmin` or a 200-char annotationId.
7. **Immortal Field Tampering**: Trying to mutate `bookId`, `chapterNumber`, `verseNumber`, `ownerId`, or `createdAt` during `update`.
8. **Client-Spoofed Timestamp**: Sending a hardcoded past/future `Date` for `createdAt` or `updatedAt` instead of `serverTimestamp()` (`request.time`).
9. **Resource Exhaustion (Note Bomb)**: Sending `noteText` with 10,000 characters (`> 5000`).
10. **Array Overflow / Malformed Highlight**: Sending `textHighlights` with 25 items (`> 20`) or an invalid stream/color enum value.
11. **Invalid Enum Poisoning**: Sending `highlightColor: "purple"` outside `['none', 'amber', 'emerald', 'sky', 'rose']`.
12. **Cross-User List Scraping**: User `u1` attempting `list` on `/users/u2/annotations`.
