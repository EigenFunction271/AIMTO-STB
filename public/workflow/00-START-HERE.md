# Start here

The workshop starts in [`../workflow.js`](../workflow.js). That file is the
switchboard: it chooses the broken or answer version of each checkpoint.

## Where things live

```text
app.js
  ├─ chooses model-sources/live.js or model-sources/fixture.js
  └─ sends the customer message to workflow.js
                                  ↓
                  chooses broken/ or answers/
                                  ↓
                         pipeline.js runs it

order.js supplies shared menu facts and validation rules.
```

- [`../workflow.js`](../workflow.js) — start here and switch one checkpoint.
- [`../model-sources/live.js`](../model-sources/live.js) — gets text from the live AI provider.
- [`../model-sources/fixture.js`](../model-sources/fixture.js) — supplies saved AI responses when live access is unavailable and during tests. It is not an answer.
- [`order.js`](order.js) — contains the menu, example order, parsing, and validation shared by both versions.
- [`pipeline.js`](pipeline.js) — moves the order through the four selected stages.
- [`broken/`](broken/) — contains the intentionally risky workshop implementations.
- [`answers/`](answers/) — contains openly browsable reference implementations.

## Compare each checkpoint

| Checkpoint | Workshop problem | Open reference answer |
| --- | --- | --- |
| 1. Understanding | [`broken/01-understanding.js`](broken/01-understanding.js) | [`answers/01-understanding.js`](answers/01-understanding.js) |
| 2. Money | [`broken/02-money.js`](broken/02-money.js) | [`answers/02-money.js`](answers/02-money.js) |
| 3. Handoff | [`broken/03-handoff.js`](broken/03-handoff.js) | [`answers/03-handoff.js`](answers/03-handoff.js) |
| 4. Promise | [`broken/04-promise.js`](broken/04-promise.js) | [`answers/04-promise.js`](answers/04-promise.js) |

The matching files have the same checkpoint number. Open them side by side,
then change only the matching selection in [`../workflow.js`](../workflow.js).

## Data journey

1. [`../app.js`](../app.js) selects the live or fixture model source.
2. [`../workflow.js`](../workflow.js) selects broken or answer stage functions.
3. [`pipeline.js`](pipeline.js) runs understanding → money → handoff → promise.
4. [`order.js`](order.js) provides the shared facts and validation rules.
5. A failed checkpoint stops the journey so its problem is visible.
