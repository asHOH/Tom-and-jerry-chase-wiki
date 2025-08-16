# Design Document

## Overview

This document outlines the technical design for an online article editing system integrated into the Tom and Jerry Chase Wiki. The architecture leverages Supabase for its backend-as-a-service capabilities, including authentication, database, and a hybrid security model combining Row and Column Level Security. The frontend will be built with Next.js and will feature a rich text editor, version history tracking, and role-based UI components.

## Architecture

### Backend: Supabase

- **Authentication**: Supabase Auth will manage user accounts (Contributors, Reviewers, Coordinators). Custom logic will handle generating unique salts for each user and using them to hash credentials for passwordless (username-only) and password-based logins.
- **Database**: A PostgreSQL database will store all data. A combination of database views (for CLS) and RLS policies will be enforced on all critical tables to ensure data security.
- **Storage**: Supabase Storage can be used for hosting images or other assets uploaded via the rich text editor.

### Frontend: Next.js

- **UI Components**: React components will be developed for viewing articles, a rich text editor, displaying version history (diffing), and administrative dashboards.
- **API Layer**: Next.js API routes will serve as a proxy to Supabase for sensitive operations or to encapsulate complex business logic. However, most data fetching can be done directly from the client using the Supabase JS library, querying the secure database views.
- **State Management**: Valtio and SWR will be used for managing global state and caching data from the backend.

## Data Models (Supabase Tables)

### Custom Enum Types

To ensure data integrity, the following custom ENUM types will be created and used in the table definitions.

- **`role_type`**: Defines the possible user roles.
  - Values: `'Contributor'`, `'Reviewer'`, `'Coordinator'`
- **`version_status`**: Defines the lifecycle status of an article version.
  - Values: `'pending'`, `'approved'`, `'rejected'`, `'revoked'`
- **`visibility_type`**: Defines the default visibility for categories.
  - Values: `'approved'`, `'pending'`
    @

### `roles`

Stores the different user roles.

| Column | Type        | Constraints      |
| ------ | ----------- | ---------------- |
| `id`   | `uuid`      | Primary Key      |
| `name` | `role_type` | Not Null, Unique |

### `users`

Stores user account information.

| Column          | Type   | Constraints                                  |
| --------------- | ------ | -------------------------------------------- |
| `id`            | `uuid` | Primary Key, Foreign Key to `auth.users(id)` |
| `username_hash` | `text` | Not Null, Unique                             |
| `nickname`      | `text` | Not Null, Unique                             |
| `password_hash` | `text` | Nullable                                     |
| `salt`          | `text` | Not Null                                     |
| `role_id`       | `uuid` | Not Null, Foreign Key to `roles(id)`         |

### `categories`

Stores article categories in a hierarchical structure.

| Column               | Type              | Constraints                               |
| -------------------- | ----------------- | ----------------------------------------- |
| `id`                 | `uuid`            | Primary Key                               |
| `name`               | `text`            | Not Null                                  |
| `parent_category_id` | `uuid`            | Nullable, Foreign Key to `categories(id)` |
| `default_visibility` | `visibility_type` | Nullable                                  |

### `articles`

Stores the core article data.

| Column        | Type          | Constraints                               |
| ------------- | ------------- | ----------------------------------------- |
| `id`          | `uuid`        | Primary Key                               |
| `title`       | `text`        | Not Null                                  |
| `category_id` | `uuid`        | Not Null, Foreign Key to `categories(id)` |
| `author_id`   | `uuid`        | Not Null, Foreign Key to `users(id)`      |
| `created_at`  | `timestamptz` | Not Null, Default `now()`                 |

### `article_versions`

Stores the content for each version of an article.

| Column          | Type             | Constraints                                     |
| --------------- | ---------------- | ----------------------------------------------- |
| `id`            | `uuid`           | Primary Key                                     |
| `article_id`    | `uuid`           | Not Null, Foreign Key to `articles(id)`         |
| `content`       | `text`           | Not Null (Rich text format, e.g., JSON or HTML) |
| `editor_id`     | `uuid`           | Not Null, Foreign Key to `users(id)`            |
| `status`        | `version_status` | Not Null                                        |
| `preview_token` | `text`           | Not Null, Unique (For public previews)          |
| `created_at`    | `timestamptz`    | Not Null, Default `now()`                       |

## Security Strategy: Hybrid RLS and CLS

To provide fine-grained control over data access, the system will implement a hybrid security model that combines the strengths of Row Level Security (RLS) and Column Level Security (CLS). CLS will be achieved by creating specific database views that only expose permitted columns to different roles. RLS will then be applied to the underlying tables to filter which rows are visible.

### Column Level Security (CLS) via Views

- **`users_public_view`**: A view on the `users` table that exposes only non-sensitive public information.
  - **Columns**: `id`, `nickname`
  - **Access**: Granted to all users, including anonymous visitors.

- **`article_versions_public_view`**: A view on the `article_versions` table that hides sensitive tokens.
  - **Columns**: `id`, `article_id`, `content`, `editor_id`, `status`, `created_at` (omits `preview_token`).
  - **Access**: Granted to all users, to be used in conjunction with RLS.

- **Sensitive Data**: Columns like `username_hash`, `password_hash`, and `salt` in the `users` table, and `preview_token` in `article_versions`, will not be included in any public-facing view. They will only be accessible through `security definer` functions on the server-side during authentication or preview link generation.

### Row Level Security (RLS) on Base Tables

RLS policies remain essential for filtering which rows a user can see. These policies will be applied to the base tables.

- **`articles` & `article_versions`**:
  - **Public Read**: RLS policy allows rows where `status = 'approved'` to be visible.
  - **Contributor/Reviewer Read**: RLS policy allows rows where `status = 'pending'` or `status = 'rejected'` to be visible to authenticated contributors and reviewers.
  - **Preview Read**: A `security definer` function will bypass RLS to fetch a specific version if a valid `preview_token` is provided.

- **`users`**:
  - RLS policies will ensure a user can only see their own row in the base `users` table. Coordinators will have a policy that grants them access to all rows.

## Components and Interfaces

- **Rich Text Editor**: A component based on a library like Tiptap or Plate.js, configured to output a clean JSON or HTML structure.
- **`ArticleView`**: Renders the approved content of an article.
- **`ArticleEditor`**: Wraps the rich text editor and handles the submission of new article versions.
- **`VersionHistoryView`**: Displays a list of article versions and allows for viewing content and diffs between versions.
- **`PendingDashboard`**: A view for Contributors and Reviewers to see all `pending` submissions.
- **`AdminPanel`**: A UI for Coordinators to manage user roles and credentials.

### Login/Registration Flow

The login and registration process is unified into a multi-step flow driven by a single component.

1.  **Step 1: Enter Username.** The initial UI (`UsernameForm`) presents a single text input for the username and a "Continue" button.
2.  **Step 2: Check Username.** Upon submission, the client calls a dedicated API endpoint (e.g., `/api/auth/check-username`) with the provided username. The backend checks the `users` table and returns one of three states:
    - `exists_no_password`
    - `exists_with_password`
    - `not_exists`
3.  **Step 3: Conditional Rendering.** The frontend conditionally renders the next step based on the API response:
    - **`exists_no_password`**: The user is logged in automatically. The API returns a session token, and the user is redirected.
    - **`exists_with_password`**: The UI transitions to a `PasswordForm`, showing only a password input field to complete the login.
    - **`not_exists`**: The UI transitions to a `RegistrationForm`, showing inputs for Nickname and an optional Password to create a new account.

This approach streamlines the entry point for users and avoids separate "Login" and "Register" pages.

## Testing Strategy

- **Unit Tests**: Test individual utility functions, such as username/password hashing and permission checks.
- **Integration Tests**: Write tests for the RLS policies and database views using Supabase's testing framework to ensure they behave as expected.
- **End-to-End (E2E) Tests**: Use a framework like Cypress or Playwright to test the complete user flows:
  1.  Contributor submits an edit.
  2.  Reviewer previews and approves the edit.
  3.  Visitor views the updated article and its history.
  4.  Coordinator changes a user's role.
