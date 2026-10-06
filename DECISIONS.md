# Decisions

Yours to write, not your AI's. Short is good — bullets are fine, and half a page is
plenty. We read this first.

## What did the spec not tell you?

There are things this brief doesn't specify. Which ones did you hit, what did you decide,
and why?

What a "week" is.** I used ISO weeks, Monday to Sunday. `from` snaps back to its Monday and `to` snaps forward to its Sunday. Only Mon–Fri counts toward allocation. Many assignments end on a Saturday or Sunday, so counting calendar days puts Ana at 56/40 when the real figure is 40/40.

- **Rows that look like duplicates.** Ana has 15 rows with identical dates (14×0.5h + 1×1.0h). These are split allocations, so I sum every row and never dedupe.
- **Range size.** The API accepts 1–12 weeks and returns 400 above that. 12 is a server guard sized for thousands of people and two years of history. The UI allows 4–12 weeks (default 4). The 4-week minimum is a display choice only, so another consumer like the team overview page can still ask for 1 week.
- **JSON shape.** Each person gets `allocated[i]` lined up with `weeks[i]`, plus one `weeklyHours`. I rejected one object per cell because of payload size at thousands × 12. The schema has no per-week capacity, so capacity is the same in every week.
- **What an edit means.** `weekly_hours` is one value per person, so an edit changes every week, past ones included. The UI says so.
- **Capacity 0** (Eli: 0h capacity, 20h allocated). There's no percentage. The cell shows hours with an alert icon and counts as over-allocated. Nothing divides by zero.
- **How the grid stays correct after a save.** Saves are pessimistic: the cell shows "Saving…" until the server confirms. Then I patch `weeklyHours` in every cached range and invalidate, so the visible range refetches in the background. The refetch closes a race where a range request already in flight comes back with the old value. I didn't go optimistic because a capacity change is a deliberate act, and the grid should never show a number that might be rolled back.
- **What a failed save looks like.** The input stays open with the typed value, an inline server message, and Retry and Cancel. The grid keeps the old value.
- **Holidays.** There's no holiday data. I assumed Jan 1 and Dec 25 only and show an ⓘ on that week. Capacity isn't reduced, because there's no country per person.
- **URL state.** The range and search live in the URL, so Back goes to the previous range. URL values are treated as untrusted and clamped.

## What did you notice that looked wrong?

Anything in the output that didn't match what you expected. Whether you fixed it or left
it, we want to know you saw it.

- Jan 1 falls in the default range. People are allocated a full 8h that day. I left it, as above.
- Eli has 0 capacity and 20h allocated. It looks like a data error, but I treated it as real and flagged it.
- **Dee (id 4) showed 0 weekly hours partway through.** It wasn't from the code. Most likely a manual edit while testing, since the DB keeps state across runs. I set it back to 40 via PATCH. It also shows that edits persist and there's no undo or audit trail.
- The first query took about 400ms. `generate_series` over dates makes Postgres guess 1000 rows and turn on JIT. Switching to an integer series brought it to 58ms for 26 weeks × 500 people.
- Left as is: a URL like `weeks=50` stays in the address bar until the next change (the UI shows the clamped 12). In the 12-week view, the today line touches the cell text.

## What did the AI get wrong that you caught?

One concrete example. Every real session has one.

- The AI wrote a "Couldn't reach the server" message for network failures. When I stopped the API in the browser, the screen showed "Request failed (502)" instead. The Vite dev proxy answers 502 rather than failing the fetch, so that branch never ran. Fixed by treating 502/503/504 as unreachable, with a test.
- *(Other options if you'd rather use one: the popovers opened in the middle of the screen instead of next to their trigger, and Eli's tooltip was clipped by the sticky column with a see-through background. Or: the AI's file split meant one commit slice didn't typecheck on its own.)

## What would you do differently with a week?

- **Capacity history.** Today an edit silently rewrites past weeks' utilisation. I'd store capacity with effective dates so the past stays true.
- **Scale.** Row virtualisation and server-side paging and search. Search is currently client-side over the loaded range.
- **Real holidays and time off,** per person or country, actually reducing capacity.
- **Concurrent edits.** PATCH is last-write-wins. I'd add a version or ETag check and an audit log.
- Prefetch the next and previous ranges, and add an end-to-end test of edit → failed save → retry.
