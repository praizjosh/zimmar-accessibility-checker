## Architecture Rules

- **Keep `/api` and `/infra` changes provider-agnostic.** Any change to backend (`/api`) or infrastructure (`/infra`) code, config, or scripts must work identically across all supported auth providers (e.g. Clerk, Keycloak, Authentik). Never hardcode a single provider's names, claim shapes, org/organization semantics, endpoints, or env-var assumptions in shared logic. Branch only on the `IdentityClaims` abstraction (`claims.provider`, `claims.provider_subject`, `claims.email`, etc.) and the `AUTH_PROVIDER` setting — not on provider-specific identifiers. Provider names may appear only as stored data values or as illustrative examples in comments/docstrings, never as control-flow conditions in provider-neutral paths.

---

## Workflow Rules

- **Do all work on its own branch and open a PR — no exceptions.** Never commit directly to `main`. This applies to _every_ kind of change, including but not limited to: features, bug fixes, hotfixes, refactors, documentation updates, config/dependency changes, CI/infra tweaks, test-only changes, and chores. For each change, create a dedicated branch, push it, and open a pull request targeting `main`. `main` is protected — do not push to it directly.
- **Use a descriptive, type-prefixed branch name**, e.g. `feat/<short-description>`, `fix/<short-description>`, `hotfix/<short-description>`, `docs/<short-description>`, `refactor/<short-description>`, `chore/<short-description>`, `test/<short-description>`, or `ci/<short-description>`.
- **Write commit messages following [Conventional Commits](https://www.conventionalcommits.org/).** Format: `<type>(<optional scope>): <description>`, with an optional body and footer. Use the standard types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `build`, `perf`, `style`, or `revert`. Keep the description in the imperative mood and lowercase. Signal breaking changes with a `!` after the type/scope (e.g. `feat(api)!: …`) and/or a `BREAKING CHANGE:` footer. Examples: `feat(api): add env-var fallback for provider keys`, `fix(ui): prevent duplicate provider test requests`, `docs(agents): broaden branch+PR rule to all change types`.

---

## Git Rules

- **Rebase before merging.** When your PR is ready to merge, rebase it onto the latest `main` to ensure a clean, linear commit history. This also helps catch any merge conflicts early and ensures that your changes integrate smoothly with the latest codebase. Avoid merging `main` into your branch; instead, use `git rebase main` to update your branch with the latest changes from `main`.
- **Use PR descriptions to explain the "why" and "what" of changes.** The PR description should provide context for the change, including the motivation behind it, the problem it solves, and any relevant details that reviewers should know. This helps reviewers understand the intent of the change and provides a record for future reference.
- **Link related issues and PRs.** If the change addresses an existing issue, reference it in the PR description (e.g. "Fixes #123"). If the change is related to other PRs (e.g. a backend change that requires a corresponding frontend change), link them together in the descriptions to provide context for reviewers.
- **Use human-readable branch names and commit messages.** Branch names and commit messages should be descriptive and easy to understand. Avoid using cryptic abbreviations or codes that may not be clear to all team members. The goal is to make it easy for anyone to understand the purpose of a branch or commit at a glance. Use simple language that even a junior developer or non-technical stakeholder could understand.
- **New branch per issue/feature.** Each branch should focus on a single issue, feature, or logical unit of work. This makes it easier to review and test changes, and helps maintain a clean commit history. Avoid bundling multiple unrelated changes into a single branch or PR.

---

## Coding Rules

- **Write clear, maintainable code.** Follow best practices for code readability, including meaningful variable and function names, consistent formatting, and modular design. Avoid clever or overly complex solutions that may be difficult for others to understand or maintain in the future.
- **Document your code.** Use docstrings and comments to explain the purpose of functions, classes, and complex logic. This helps other developers understand your code and makes it easier to maintain in the future. Keep it short and concise, but provide enough context for someone who is not familiar with the codebase to understand the intent and functionality. Also only add comments where necessary — if the code is self-explanatory, it may not need a comment. Strive for a balance between too many comments (which can clutter the code) and too few comments (which can make it hard to understand). Again, the comments should add value and be very short - if it's more than 20 words, consider whether the code itself can be refactored to be more self-explanatory instead of relying on a long comment. DOn't spam comments in every code change. Only when absolutely necessary!
- **Write tests for your code.** Ensure that your code is well-tested with unit tests, integration tests, or end-to-end tests as appropriate. This helps catch bugs early and ensures that your code works as intended. Aim for good test coverage, but prioritize meaningful tests that cover critical functionality and edge cases over achieving a specific percentage.
- **Follow the DRY principle.** Don't Repeat Yourself. If you find yourself writing the same code more than once, consider refactoring it into a reusable function or module. This helps reduce code duplication and makes it easier to maintain and update in the future.
- **Handle errors gracefully.** Anticipate potential errors and edge cases in your code, and handle them appropriately. This may include using try-except blocks, validating input, and providing meaningful error messages to help with debugging and user experience.
- **Optimize for readability over performance.** In most cases, it's better to write clear and maintainable code than to optimize for performance prematurely. Focus on writing code that is easy to understand and maintain, and only optimize for performance when there is a demonstrated need based on profiling or specific requirements. Simplicity over complexity should be the guiding principle in your coding decisions.
- **Do not nest ternary expressions.** Always use if/else, switch statements, or helper functions to keep logic clear and maintainable. Nested ternaries are forbidden in all code and refactoring.
- **Do not use IIFEs (Immediately Invoked Function Expressions).** Instead of `{(() => { ... })()}` in JSX or elsewhere, extract the logic into a named helper function, a variable above the return, or use simple conditional expressions. IIFEs reduce readability and are forbidden in all code and refactoring.
- **Prefer named imports over namespace access for React types.** Use `import { ReactNode } from "react"` and reference `ReactNode` directly instead of `import React from "react"` with `React.ReactNode`. The exception is when many React types are used and prefixing with `React.` improves clarity — in that case, namespace access is acceptable.

---

## File Structure Rules

- **Utility, hook, and context modules live in their own folder with an `index.ts`/`index.tsx` entry point** — e.g. `src/lib/util/exportUtils/index.ts`, not `src/lib/util/exportUtils.ts`. Co-locate the unit test as `index.test.ts` in the same folder — e.g. `src/lib/util/exportUtils/index.test.ts`. Applies to new modules and whenever an existing flat-file module is touched significantly.
- **Shared test helpers/mocks live under `src/lib/test-utils/<helperName>/index.ts`**, one folder per helper (e.g. `src/lib/test-utils/createMockQueryResult/index.ts`, `src/lib/test-utils/createReactQueryMock/index.ts`) — same folder + `index.ts` + co-located `index.test.ts` convention as other util modules. Do not add a flat `src/lib/test-utils/index.ts` barrel; each helper gets its own named folder.

---

## Hook Preferences

- Prefer `useUser` (`src/context/useUser/index.tsx`) over `useCurrentUser` (`src/hooks/useCurrentUser/index.ts`) for accessing the current user. `useUser` provides richer context (including `setUser`, `emailIsVerified`, etc.) and is the canonical way to access user state in client components.

---

## Testing

- assertions should be based on the changes made or added
- assertions test for visibility of relevant elements and not if they are present in the document
- adhere to DRY principles
- **Prefer `userEvent` over `fireEvent`** for simulating clicks, typing, and other user interactions. `userEvent` models the full sequence of real browser events (pointer, hover, focus) around an interaction, while `fireEvent` only dispatches the single synthetic event named — reach for `fireEvent` only when you need to trigger a low-level DOM event `userEvent` doesn't cover.
- **Colocate every test file with the component or module it tests** — e.g. `src/lib/test-utils/createReactQueryMock/index.test.ts` next to `index.ts`, or `fleetColumns.test.tsx` next to `fleetColumns.tsx` for flat-file modules. Don't collect tests into a separate top-level `__tests__`/`tests` directory.

---

## UI Component Library

- **shadcn/ui (`@components/ui/*`) is the preferred UI component library for this repo.** Use it by default for any new UI element — buttons, dialogs/modals, dropdowns, tabs, selects, inputs, badges, etc. — instead of hand-rolling the equivalent with raw HTML elements and manual state/styling.
- Only skip shadcn when there's no equivalent component available, or there's a valid, documented reason it can't be used (e.g. a hard technical constraint). Note the reason in the PR description or a code comment when this applies.
- When touching existing hand-rolled UI that has a shadcn equivalent, prefer migrating it to shadcn as part of that change rather than extending the hand-rolled version further.

---

## Deprecated Types and Components (Do Not Use)

- `StrInt` (type, src/types/generics.ts): Use explicit `string` or `number` types instead. Remove where practical.
- `InputError` (component, @/components/core/FormElements/InputError.tsx): Use `FormError` instead. Will be removed in a future release.
- `Toggle` (component, @/components/core/\_atoms/Toggle/index.tsx): Use `@components/ui/switch.tsx` instead. Will be removed in a future release.

**Agents and contributors must not use these in new code, refactoring, or code generation. Migrate existing code away from these as soon as possible.**
