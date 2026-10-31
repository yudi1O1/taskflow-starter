# Implementation notes

## Bugs I found and fixed

- **Race condition:** Two concurrent completions could overwrite each other's counter because the update used read-then-save. I now set status and increment the counter in one MongoDB operation.
- **Authentication/session:** Expired access tokens were not refreshed even though refresh tokens were stored. The client now refreshes, retries the request, and clears the session if refresh fails.
- **Data-layer performance:** The task list queried once per task for assignee details. I now use Mongoose `populate` in the task query.
- **Frontend state:** Polling could outlive the task list and stale responses could replace newer results. I added timer cleanup and discard responses after a newer request starts.

## Filtering and saved views

I added filters for status, assignee, due-date range, and title search. Named views are stored in MongoDB under their owner's account, so they persist across sessions. I chose private views because the brief does not define team permissions. Saving an existing name updates that user's view. If an assignee is deleted, the saved ID remains and the UI shows it as unavailable. Date ranges include both ends and use UTC calendar days for consistent boundaries across timezones.

## AI assistance and approach

I used ChatGPT to inspect the starter code, discuss options, and help implement changes. I checked the code against the brief and verified behavior before keeping each change. One incomplete first pass saved the last-applied filters, so recent control changes could be missed. I caught this and changed saving to use the current controls.

I built the frontend, checked backend syntax, and exercised the API against seeded MongoDB data. I covered login and refresh, filters, saved-view persistence and privacy, and concurrent completion. The seed script clears saved views when resetting users and tasks, avoiding records tied to deleted accounts.

## What I would do with another day

I would add automated tests for concurrency, refresh failure, view ownership, deleted assignees, invalid filters, and UTC boundaries. I would also add pagination and indexes for larger task lists.
