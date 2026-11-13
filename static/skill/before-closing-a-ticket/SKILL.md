# before-closing-a-ticket

> Skill of the Rovo agent **Le fil** (Trame). Published in the open: copy it
> into any agent that proposes closing a Jira ticket.

## When to use

Before proposing, recommending or performing the closure of a ticket — and
before answering "is this ticket done?".

## What to do

1. **Read the weave of the ticket.** Call `get-criterion` for each acceptance
   criterion, or `get-coverage` on the ticket scope. Report the number of
   criteria and the number covered, with the date of the measure.
2. **Name the strength of each coverage.** A criterion covered only by a
   declaration is *covered on paper*: say it in those words, and say which
   criterion it is. Machine (an automated run, green) and attested (a third
   party, with an artefact) are the only strengths that prove a behaviour.
3. **Check the perforations.** A criterion modified after its last verification
   is no longer covered, even though a mesh exists. Call `list-perforations` on
   the ticket: if one is open, ask for the verification to be replayed before
   closure.
4. **Check the dangling threads.** A disabled, ignored or renamed test, or a
   deleted criterion, removes coverage. Call `list-dangling`; if a thread died,
   the coverage went down and you say so.
5. **Never treat a derived link as coverage.** A similarity-based link is a
   proposal with a confidence: it belongs on the provisional line. If the only
   coverage of a criterion is derived, the criterion is a hole.
6. **Report unfalsifiable criteria.** A criterion that nothing can verify
   ("must be fast", "must be user-friendly") cannot be covered. Call
   `list-unverifiable` and propose the reformulation, with the measure.
7. **Ask for a test instead of asserting.** When a criterion has no
   verification act, propose a test draft (`propose-test`) and name the hole's
   priority and its métré terms. Never write "this is verified" on the basis of
   a comment, a status or your own reading of the code.
8. **Distinguish what you cannot see.** If Trame has no right on an object
   type, or no data for a scope, say it — do not turn your blind spot into a
   hole in the project.
9. **Do not block, do not attest.** Closure remains a human decision. You show
   the weave, its holes and its perforations; you never claim an act in your own
   name, and you never sign for someone else.

## Shape of the answer

```
Ticket PROJ-412 — weave of 12 November, 6 criteria.
Covered: 4 (2 machine, 1 attested, 1 declared only).
Perforated: AC-3 — changed 9 November, last verified 3 October (37 days).
Dangling: AC-5 — test `PROJ-412.testShouldRetry` disabled on 10 November.
Unfalsifiable: AC-6 — "the dashboard must be fast" (proposed: p95 < 2 s).
Hole (priority 0.86, security, zone src/pay broke twice): AC-4.
Nothing here is applied: 3 proposals are in the validation queue.
```
