// Phase 0 Security Rules Verification Spec ("Dirty Dozen" Adversarial Payloads)
// Designed for @firebase/rules-unit-testing against firestore.rules

export const DIRTY_DOZEN_CASES = [
  { id: 1, name: 'Unauthenticated create', path: 'users/u1/annotations/JHN_1_1', auth: null, expect: 'PERMISSION_DENIED' },
  { id: 2, name: 'Unverified email write', path: 'users/u1/annotations/JHN_1_1', auth: { uid: 'u1', email_verified: false }, expect: 'PERMISSION_DENIED' },
  { id: 3, name: 'Cross-user read/write', path: 'users/u2/annotations/JHN_1_1', auth: { uid: 'u1', email_verified: true }, expect: 'PERMISSION_DENIED' },
  { id: 4, name: 'OwnerId spoofing', path: 'users/u1/annotations/JHN_1_1', payload: { ownerId: 'u2' }, expect: 'PERMISSION_DENIED' },
  { id: 5, name: 'Shadow field injection', path: 'users/u1/annotations/JHN_1_1', payload: { isAdmin: true }, expect: 'PERMISSION_DENIED' },
  { id: 6, name: 'Invalid path ID poisoning', path: 'users/u1/annotations/bad$id', auth: { uid: 'u1', email_verified: true }, expect: 'PERMISSION_DENIED' },
  { id: 7, name: 'Immutable bookId mutation on update', path: 'users/u1/annotations/JHN_1_1', payload: { bookId: 'GEN' }, expect: 'PERMISSION_DENIED' },
  { id: 8, name: 'Client-forged updatedAt timestamp', path: 'users/u1/annotations/JHN_1_1', payload: { updatedAt: '2020-01-01T00:00:00Z' }, expect: 'PERMISSION_DENIED' },
  { id: 9, name: 'Oversized noteText (>5000 chars)', path: 'users/u1/annotations/JHN_1_1', payload: { noteText: 'x'.repeat(5001) }, expect: 'PERMISSION_DENIED' },
  { id: 10, name: 'Array overflow textHighlights (>20)', path: 'users/u1/annotations/JHN_1_1', payload: { textHighlightsCount: 21 }, expect: 'PERMISSION_DENIED' },
  { id: 11, name: 'Invalid highlightColor enum', path: 'users/u1/annotations/JHN_1_1', payload: { highlightColor: 'neon' }, expect: 'PERMISSION_DENIED' },
  { id: 12, name: 'Cross-user collection list query', path: 'users/u2/annotations', auth: { uid: 'u1', email_verified: true }, expect: 'PERMISSION_DENIED' },
] as const;
