# Implementation Plan

This plan breaks down the work required to implement the online article editing feature into sequential, actionable tasks.

- [x] 1. **Backend Setup (Supabase)**
  - [x] 1.1. Initialize a new Supabase project.
  - [x] 1.2. Write and execute SQL scripts to define custom enum types (`role_type`, `version_status`, `visibility_type`) and the base table schema.
  - [x] 1.3. Create database views (e.g., `users_public_view`, `article_versions_public_view`) to expose only the columns safe for public consumption, implementing Column Level Security.
  - [x] 1.4. Implement Row Level Security (RLS) policies on the base tables to control row visibility based on user role and status (e.g., `approved` vs. `pending`).
  - [x] 1.5. Create PostgreSQL `security definer` functions for sensitive operations like generating salts, hashing credentials, and checking permissions.

- [x] 2. **Authentication & User Management**
  - [x] 2.1. Create the multi-step UI component for the unified login/registration flow.
  - [x] 2.2. Implement the backend API endpoint (e.g., `/api/auth/check-username`) to handle the initial username check.
  - [x] 2.3. Implement the client-side logic to process the API response and render the appropriate next step (password field or new registration form).
  - [x] 2.4. **Coordinator Admin Panel**
    - [x] 2.4.1. Create the page and basic layout for the user management panel at `/admin/users`.
    - [x] 2.4.2. Show 404 for any other users who visit the panel.
    - [x] 2.4.3. Implement a Supabase function for Coordinators to fetch all user data.
    - [x] 2.4.4. Build the UI to display the list of users with their current roles and nicknames.
    - [x] 2.4.5. Add a UI element (e.g., dropdown) to change a user's role.
    - [x] 2.4.6. Implement the backend logic to securely update a user's role.
    - [x] 2.4.7. Add a UI element (e.g., modal) for updating a user's nickname and password.
    - [x] 2.4.8. Implement the backend logic for Coordinators to update nicknames and reset passwords.
  - [x] 2.5. **User Settings Page**
    - [x] 2.5.1. Create the UI for user settings (e.g., a dropdown menu, shown when clicking the button on the right of navigation bar).
    - [x] 2.5.2. Build the form for a user to change their own password. (skipped)
    - [x] 2.5.3. Implement the backend logic for a user to securely update their password. (skipped)

- [x] 3. **Content Creation & Editing**
  - [x] 3.1. **Rich Text Editor Integration**
    - [x] 3.1.1. Choose and install a rich text editor library (e.g., Tiptap).
    - [x] 3.1.2. Create a reusable React component that wraps the editor.
    - [x] 3.1.3. Configure the editor with necessary plugins (e.g., headings, lists, images).
  - [x] 3.2. **Article Editor Page**
    - [x] 3.2.1. Create the page for creating new articles (e.g., `/articles/new`).
    - [x] 3.2.2. Create the page for editing existing articles (e.g., `/articles/[id]/edit`).
    - [x] 3.2.3. Add fields for title and category selection.
    - [x] 3.2.4. Integrate the rich text editor component for the article body.
  - [x] 3.3. **Submission Logic**
    - [x] 3.3.1. Implement the client-side function to gather article data (title, content, category).
    - [x] 3.3.2. Create a Supabase function to create a new `pending` entry in the `article_versions` table.
    - [x] 3.3.3. Connect the editor page's "Submit" button to the submission logic.
  - [x] 3.4. **Category Management**
    - [x] 3.4.1. Create a basic UI for Coordinators to view, create, and edit categories.
    - [x] 3.4.2. Implement the backend functions for category CRUD operations.
    - [x] 3.4.3. Add UI controls to the category editor for setting `default_visibility`.
    - [x] 3.4.4. Modify the article creation logic to inherit `default_visibility` from its selected category.

---

### Phase 1: Backend API Development

---

- [x] 4. **Backend - Moderation & Public API**
  - [x] 4.1. **Public Viewing Endpoints**s
    - [x] 4.1.1. Create an API endpoint (e.g., `GET /api/articles/[id]`) to fetch the latest approved version of an article for public viewing.
    - [x] 4.1.2. Create an API endpoint (e.g., `GET /api/articles/[id]/history`) to fetch the list of all approved versions for an article.
    - [x] 4.1.3. Create an API endpoint (e.g., `GET /api/articles/preview/?token=[token]`) to fetch a specific article version using its preview token. This endpoint will be public and will use a `security definer` function internally to bypass RLS.
  - [x] 4.2. **Moderation Endpoints (Reviewer Role Required)**
    - [x] 4.2.1. Create an API endpoint (e.g., `GET /api/moderation/pending`) to fetch all `pending` article versions for contributors.
    - [x] 4.2.2. Create an API endpoint (e.g., `POST /api/moderation/[versionId]?action=approve`) for reviewers to approve a pending version.
    - [x] 4.2.3. Create an API endpoint (e.g., `POST /api/moderation/[versionId]?action=reject`) for reviewers to reject a pending version.
    - [x] 4.2.4. Create an API endpoint (e.g., `POST /api/moderation/[versionId]?action=revoke`) for reviewers to revoke a previously approved version, reverting to the prior one. This will encapsulate the complex logic on the backend.

---

### Phase 2: Frontend UI & Integration

---

- [ ] 5. **Frontend - Public Viewing**
  - [ ] 5.1. **Main Article View**
    - [ ] 5.1.1. Create the main article page UI (e.g., `/articles/[id]`).
    - [ ] 5.1.2. Integrate the UI with the `GET /api/articles/[id]` endpoint to display the latest approved content.
  - [ ] 5.2. **Version History Page**
    - [ ] 5.2.1. Create the version history page UI (e.g., `/articles/[id]/history`).
    - [ ] 5.2.2. Integrate the UI with the `GET /api/articles/[id]/history` endpoint to list all approved versions.
  - [ ] 5.3. **Preview Page**
    - [ ] 5.3.1. Create the dynamic preview page UI (e.g., `/previews/[token]`).
    - [ ] 5.3.2. Integrate the UI with the `GET /api/previews/[token]` endpoint.
    - [ ] 5.3.3. Add a prominent banner to the page indicating it's a preview.
  - [ ] 5.4. **(Optional) Diff Viewer**
    - [ ] 5.4.1. Research and select a library for text diffing (e.g., `diff-match-patch`).
    - [ ] 5.4.2. Create a component that takes two content strings and displays a visual diff.
    - [ ] 5.4.3. Integrate the diff component into the version history page.

- [ ] 6. **Frontend - Moderation Workflow**
  - [ ] 6.1. **Pending Changes Dashboard**
    - [ ] 6.1.1. Create the page and layout for the moderation dashboard (e.g., `/moderation/pending`).
    - [ ] 6.1.2. Integrate the UI with the `GET /api/moderation/pending` endpoint to list submissions.
    - [ ] 6.1.3. Add UI elements (buttons/links) for previewing, approving, and rejecting submissions.
  - [ ] 6.2. **Approve/Reject/Revoke Integration**
    - [ ] 6.2.1. Connect the "Approve" button to the `POST /api/moderation/approve/[versionId]` endpoint.
    - [ ] 6.2.2. Connect the "Reject" button to the `POST /api/moderation/reject/[versionId]` endpoint.
    - [ ] 6.2.3. Add a UI element for reviewers (e.g., on the history page) and connect it to the `POST /api/moderation/revoke/[versionId]` endpoint.

- [ ] 7. **Frontend - Final Touches**
  - [ ] 7.1. **UI Permissions**
    - [ ] 7.1.1. Wrap components or layouts with logic to conditionally render UI based on user role (e.g., show "Moderation Dashboard" link only to Reviewers/Coordinators). This will use the existing `useUser` hook.
