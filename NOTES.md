# Submission notes

## Bugs found and fixed

- Race condition: completion status and count now update atomically, preventing lost increments.
- Authentication/session: the client refreshes expired access tokens and clears the session if refresh fails.
- Data-layer performance: assignee details are populated in a batch instead of queried once per task.
- Frontend state: polling is cleaned up, and stale responses cannot replace newer task results.

## Filtering and saved-view assumptions

Views are private to the signed-in account and stored in MongoDB so they persist across sessions and devices; shared views would need team-level ownership and edit rules. Saving a name already used by that account replaces its filters. If an assignee is deleted, the saved ID is kept so the filter does not silently change; the UI marks the assignee unavailable. Date ranges are inclusive UTC calendar days, giving users a consistent boundary regardless of browser timezone.

## AI assistance

AI helped inspect the code, identify likely defects, and implement the fixes and feature. It initially treated a missing document named `Neko Hill Assessment.md` as a blocker, even though the already-attached `Nanoheal Assignment.md` was the source of truth; I overrode that and used the Nanoheal brief. I ran the frontend production build and backend syntax checks, then exercised the API against MongoDB with seeded data. That live check covered authentication, all task filters, saved-view persistence and privacy, refresh-token exchange, and concurrent completion updates.

## With another day

I would add API and UI integration tests for concurrent completion, token refresh and failure, saved-view ownership, deleted assignees, invalid filters, and UTC date boundaries. I would also add pagination and indexes for larger task lists.
