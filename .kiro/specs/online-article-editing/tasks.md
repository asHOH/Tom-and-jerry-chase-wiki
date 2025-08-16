# Implementation Plan

This plan breaks down the work required to implement the online article editing feature into sequential, actionable tasks.

- [x] 1. **Backend Setup (Supabase)**
  - [x] 1.1. Initialize a new Supabase project.
  - [x] 1.2. Write and execute SQL scripts to define custom enum types (`role_type`, `version_status`, `visibility_type`) and the base table schema.
  - [x] 1.3. Create database views (e.g., `users_public_view`, `article_versions_public_view`) to expose only the columns safe for public consumption, implementing Column Level Security.
  - [x] 1.4. Implement Row Level Security (RLS) policies on the base tables to control row visibility based on user role and status (e.g., `approved` vs. `pending`).
  - [x] 1.5. Create PostgreSQL `security definer` functions for sensitive operations like generating salts, hashing credentials, and checking permissions.

- [ ] 2. **Authentication & User Management**
  - [x] 2.1. Create the multi-step UI component for the unified login/registration flow.
  - [x] 2.2. Implement the backend API endpoint (e.g., `/api/auth/check-username`) to handle the initial username check.
  - [x] 2.3. Implement the client-side logic to process the API response and render the appropriate next step (password field or new registration form).
  - [ ] 2.4. Build the admin panel for Coordinators to manage user roles, usernames, nicknames, and passwords.
  - [ ] 2.5. Create a settings page for authenticated users to change their own password.

- [ ] 3. **Content Creation & Editing**
  - [ ] 3.1. Integrate a rich text editor component (e.g., Tiptap) into the application.
  - [ ] 3.2. Develop the article editor page, which allows creating new articles or proposing edits to existing ones.
  - [ ] 3.3. Implement the submission logic that creates a new `pending` entry in the `article_versions` table.
  - [ ] 3.4. Build a simple UI for Reviewers/Coordinators to manage categories.
  - [ ] 3.5. Enhance the category management UI to allow setting the `default_visibility`.
  - [ ] 3.6. Ensure the article creation process inherits this default visibility from the category.

- [ ] 4. **Moderation Workflow**
  - [ ] 4.1. Create the "Pending Changes" dashboard where Reviewers can see a list of all submissions awaiting moderation.
  - [ ] 4.2. Implement the preview page, accessible via a unique token, to display pending content.
  - [ ] 4.3. Add "Approve" and "Reject" functionality for Reviewers, which updates the status of an `article_version`.
  - [ ] 4.4. Implement the logic for revoking articles/edits.

- [ ] 5. **Public Viewing & Version History**
  - [ ] 5.1. Develop the main article page that fetches and displays the latest `approved` version of an article by querying the public views.
  - [ ] 5.2. Create the version history component that lists all approved versions of an article.
  - [ ] 5.3. (Optional) Implement a diff viewer to show changes between two versions.

- [ ] 6. **Frontend Integration**
  - [ ] 6.1. Integrate the Supabase client library (`supabase-js`) into the Next.js application context.
  - [ ] 6.2. Create all necessary pages (`/articles/[id]`, `/edit/[id]`, `/history/[id]`, `/admin/users`, etc.).
  - [ ] 6.3. Use hooks and context to manage user session and role, conditionally rendering UI elements based on permissions.

- [ ] 7. **Testing & Validation**
  - [ ] 7.1. Use Supabase's testing tools to write integration tests for both the database views (CLS) and RLS policies to ensure they work together correctly.
