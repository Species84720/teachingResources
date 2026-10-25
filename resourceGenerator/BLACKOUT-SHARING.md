# Image Blackout sharing

Teachers can turn off **Enable blackout and torch** to start the activity with
the full image visible. Existing templates keep blackout enabled by default.
The setting is saved with the template. Viewers can toggle blackout during play.

**Copy view link** saves the current activity and enables public viewing. The
link opens directly in view mode, without Google login or editing controls.
Answers and torch changes remain local to each viewer. **Stop sharing** disables
future loads of that link (an already open copy cannot be recalled).

## Required Firebase setup

Before deploying the page, add this match inside the existing
`match /databases/{database}/documents` block in Firebase Console → Firestore →
Rules, then publish the rules. Preserve the existing owner rules and other tools'
rules; this snippet is an addition, not a complete replacement ruleset.

```text
match /blackout/{docId} {
  allow get: if resource.data.isPublic == true;
}
```

This permits individual reads of explicitly shared activities. It does not grant
public collection listing or writes. Unshared templates remain protected by the
existing owner rules. Sharing exposes the image, labels, zones, and stored
template metadata (including the owner's UID) to anyone with the link.

Firestore's existing document size limit still applies to uploaded images.
Failed saves do not produce a share link.

## Deployment smoke check

1. Sign in, upload an image, add two labels and zones, disable blackout, and copy
   the view link. Reopen the saved template and verify the setting persisted.
2. Open the link in a signed-out/private window: the image should be fully visible
   and no editor or login should appear. Place labels with mouse and touch.
3. Toggle blackout, resize the window, and verify placed labels remain placed.
4. Stop sharing, then reload the private window: an unavailable message should
   appear. A missing or invalid ID should also show this message.
5. Verify unsigned writes and collection queries are denied by Firestore rules.
