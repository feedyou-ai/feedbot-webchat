---
name: data-test-attributes
description: Rules for adding, renaming or removing `data-test` attributes in the Feedbot Designer, which are the selector contract for the Cypress e2e suite. Use when an e2e test cannot select an element, when a selector does not match a shared BDD step's pattern, or when changing any `data-test` / `dataTest` prop in `packages/designer`.
---

# Data-Test Attributes

`data-test` attributes are the contract between the app and the Cypress e2e suite in
`packages/e2e-tests`. Tests select almost exclusively through them, so an attribute that is
missing, non-unique, or off-convention either makes a test impossible to write or forces a
brittle workaround. Read this before adding or renaming one.

## How tests match a data-test

`cy.dataCy(selector)` (`packages/e2e-tests/cypress/support/commands/actor.ts`) decides how to
read its argument:

- Starts with `.`, `#` or `[` → passed to `cy.get` as a raw CSS selector, untouched.
- Anything else → every space-separated word becomes `[data-test ~= "word"]`, joined into a
  **descendant** chain. So `cy.dataCy('dropdown-menu menu-item--delete')` means
  `[data-test ~= "dropdown-menu"] [data-test ~= "menu-item--delete"]`, not one element with both.

`~=` matches one whitespace-separated word inside the attribute. That is what makes multi-token
values work: a single element can carry both a generic role token and a specific one, and tests
can select by either.

## Adding an attribute: check how the target accepts it

Three styles coexist, and you cannot tell which one a component uses from the call site. Passing
the wrong one type-errors at best and silently renders nothing at worst, so **open the target
component's props first**.

1. **Component with a `dataTest` prop** (~29 components). Pass `dataTest="my-thing"`; the component
   renders `data-test={dataTest}` internally. Example:
   `BottomHeader/BotButtons/BotSettingsButton.tsx`.
2. **Component with a literal `'data-test'` prop** (~11 components, several of them in
   `design-system`: `Button`, `FeedbotSelect`, `FeedbotCreatableSelect`, `DropdownMenuList`).
   Pass `data-test="my-thing"`. `styled(Button)` wrappers inherit it.
3. **Plain DOM element or styled-component.** Write `data-test="my-thing"` directly; styled
   components forward `data-*` attributes to the DOM without any prop declaration.

Note the split does not follow package boundaries — `design-system` contains components of both
kinds — so checking the props is the only reliable approach.

If a component you need to select does not accept a data-test at all, add the prop in that
component rather than reaching for a parent selector plus `.find()` chains in the test.

## Multi-token values

Compose values with `cx` from `classnames`, generic token first, specific token after:

```tsx
data-test={cx('tab', 'dialog-tab', `dialog-tab--${tab.id}`)}
```

This lets one test select every tab (`tab`), all dialog tabs (`dialog-tab`), or one specific
dialog tab (`dialog-tab--<id>`). Use it whenever an element belongs to a repeated family.

## Naming rules

- kebab-case, lowercase.
- `--` separates a generic role from its variant or instance: `form-field--goal`,
  `menu-item--step-menu-settings-button`, `table-row--<queryId>`.
- **Do not add a descriptive suffix that breaks an interpolation the test harness relies on.**
  Several selectors are built by string interpolation from a step/entity type, so a "more
  descriptive" name silently falls outside the pattern and forces a special case in the harness.
  The AI step's goal field was originally `inline-editable-ai-goal`; because `cy.addStep` builds
  `inline-editable-${type}`, it had to be renamed to `inline-editable-ai` to work like every
  other step. The same applies to a _missing_ suffix: the "Show queries" step menu item was
  `step-menu-show-queries` and had to become `step-menu-show-queries-button`.
- When a test cannot select an element because its attribute is off-convention, fix the attribute
  here rather than adding a new Cypress step that works around it.

Contracts currently relied on by the test harness:

| Element                             | Value                                                                        | Produced in                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Step row in the tree                | `steps-list-item-<stepType>-<index + 1>` (**1-based**)                       | `components/Step/index.tsx`                                                       |
| Step type in the add-step menu      | `<stepType>-step` (a step module's `DATA_TEST`)                              | `components/steps/<Step>/index.tsx`                                               |
| Step's inline-editable primary text | `inline-editable-input inline-editable-<stepType>`                           | `components/InlineEditable/components/ContentEditable/ContentEditable.tsx`        |
| RJSF form field wrapper             | `form-field form-field--<propertyName>`                                      | `design-system/FeedbotRjsfForm/components/templates/WrapIfAdditionalTemplate.tsx` |
| Dropdown menu item                  | `menu-item menu-item--<dataTest> type--<type>`                               | `design-system/DropdownMenu/Item/BaseItem.tsx`                                    |
| Step menu item's `dataTest`         | `step-menu-<item>-button`                                                    | `components/Step/hooks/useStepMenuItems.tsx`                                      |
| Generic table row                   | `table-row--<entryId>` (only when `settings.elementKeys.row.entries` is set) | `design-system/Table/Table.tsx`                                                   |

## Uniqueness

The value must uniquely identify the element in every view where a test needs it. Two elements
sharing an identifier is the most common cause of a test that types into or asserts on the wrong
thing — and it fails silently, because the selector still matches something.

The Ace editor is the cautionary example: every `FeedbotAce` instance renders the same
`id="ace-editor"`, so on a form with two editors (a tool call's "Parameters" and "Code")
`cy.get('#ace-editor')` grabs the first one. Tests there must scope through the unique field
wrapper (`[data-test~="form-field--code"]`) instead.

When an element is one of many, include an id in the value (`table-row--${queryId}`,
`dialog-tab--${tab.id}`) rather than relying on document order.

## Conditional attributes

Render `undefined` when there is no meaningful identifier — React then omits the attribute
entirely, which is better than emitting an unstable one:

```tsx
<tr data-test={entryId ? `table-row--${entryId}` : undefined}>
```

Never fall back to an array index for an identifier that tests are meant to rely on.

## Do not duplicate what already exists

- RJSF fields, dropdown menu items, step rows and tabs already get the attributes listed in the
  table above; adding another one to the same element is noise.
- Legacy `.e2e-*` CSS classes (still used in over a hundred places in the Designer) are load-bearing: `cy.confirmModal()`
  selects `.e2e-modal-success-button`, and several specs use `.e2e-*` classes directly. Leave
  them in place, do not add new ones, and check whether one already covers your element before
  adding a `data-test`.

## Before and after adding

Before:

1. Does a stable selector already exist on the element (existing `data-test`, an inherited
   multi-token value, or an `.e2e-*` class)?
2. Is the value unique in every view a test will use it in?
3. Does it follow the interpolation contract for its family?
4. Which of the three prop styles does the target component use?

After: the Cypress dev stack serves a **static production build** of the Designer, so a running
stack keeps serving the old bundle. Restart it before expecting tests to see the new attribute —
see the Prerequisites section of `packages/e2e-tests/AGENTS.md`.
