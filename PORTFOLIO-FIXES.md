# Portfolio fixes

- Firestore projects are now merged with the original static projects instead of replacing them.
- Dashboard-added projects appear alongside the original PixelForge Studio, Xara, Rivtaf Golf Estate, and Exclusive projects.
- Matching project IDs allow Firestore edits to override the corresponding static project without duplicates.
- Project categories such as `Web Development` and `UI/UX` are normalized to the site's existing filter values (`web` and `uiux`).
- Project images now fall back to a live website screenshot before using the generated placeholder.
- The admin project form automatically stores a live website screenshot as the project thumbnail when the image field is left blank.
- Existing image/url field aliases remain supported for compatibility with older Firestore documents.
