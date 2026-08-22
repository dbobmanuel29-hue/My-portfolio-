# Firestore administrator authorization

Administrator access uses the authenticated Firebase UID and this Firestore document:

```text
admins/{uid}
role: "admin"
active: true
```

For the configured administrator:

```text
admins/TzuQW3F96GawoOcO5av6J5sUYef2
```

The document must be created or changed only through the Firebase Console or another trusted administrative environment. Firestore rules permanently deny all browser/client create, update, and delete operations on `admins`.

Custom Claims are not required by this project. Removing the document, changing `active` to `false`, or changing `role` immediately removes admin authorization after the next Firestore authorization check.