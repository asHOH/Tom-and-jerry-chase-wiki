# Requirements Document

## Introduction

This feature introduces a comprehensive online article editing system using Supabase as the backend. It allows for community-driven content creation and moderation, complete with version history, previews, and role-based permissions. This system will enable visitors to view content, contributors to submit changes, and a hierarchy of reviewers and coordinators to manage the content and users.

## Requirements

### Requirement 1: Public Viewing

**User Story:** As a visitor, I want to view articles, their modification history, and previous versions, so that I can access and understand the wiki's content and its evolution.

#### Acceptance Criteria

1.  WHEN I access an article page THEN the system SHALL display the latest approved version of the article.
2.  WHEN viewing an article THEN I SHALL see an option to view its full history.
3.  WHEN I view the history THEN the system SHALL list all previous approved versions, showing the editor and timestamp for each.
4.  WHEN I select a previous version THEN the system SHALL display its full content.

### Requirement 2: Previewing Changes

**User Story:** As any user (visitor or contributor), I want to preview a pending article or an edit using a specific link, so that I can see proposed changes before they are approved.

#### Acceptance Criteria

1.  WHEN I have a preview link for a pending change THEN I SHALL be able to access it directly without logging in.
2.  WHEN accessing a preview link THEN the system SHALL display the full content of the proposed article or edit.
3.  WHEN previewing THEN there SHALL be a clear indicator that the content is a preview and has not yet been approved.

### Requirement 3: Content Contribution

**User Story:** As a logged-in "Contributor", I want to submit new articles and edits, and see the status of my contributions, so that I can actively participate in building the wiki.

#### Acceptance Criteria

1.  WHEN I am logged in as a Contributor THEN I SHALL have the ability to create new articles or propose edits to existing ones.
2.  WHEN I submit a new article or an edit THEN it SHALL be saved with a "pending" status and not be publicly visible as the main version.
3.  WHEN I submit a change THEN the system SHALL generate a unique preview link for it.
4.  WHEN I am logged in THEN I SHALL be able to view a list of all pending articles and edits (from all contributors), each with its corresponding preview link.

### Requirement 4: Content Moderation (Reviewer)

**User Story:** As a "Reviewer", I want to moderate pending submissions and manage content visibility, so that I can ensure the quality and accuracy of the wiki.

#### Acceptance Criteria

1.  WHEN I am logged in as a Reviewer THEN I SHALL be able to preview any pending article or edit.
2.  WHEN I review a pending change THEN I SHALL have the options to "Approve" or "Reject" it.
3.  WHEN I approve a change THEN it SHALL become the new, publicly visible version of the article.
4.  WHEN I reject a change THEN it SHALL be marked as "rejected" and not become public.
5.  WHEN managing content THEN I SHALL be able to change the default visibility of any article or edit (e.g., hide an approved article).
6.  WHEN necessary THEN I SHALL be able to remove an article entirely or revoke a previously approved edit, reverting to the prior version.

### Requirement 5: User Administration (Coordinator)

**User Story:** As a "Coordinator", I want to manage user roles and permissions, so that I can maintain the structure of the contributor team.

#### Acceptance Criteria

1.  WHEN I am logged in as a Coordinator THEN I SHALL have access to a user management panel.
2.  WHEN managing users THEN I SHALL be able to assign or change a user's role (Contributor, Reviewer, Coordinator).
3.  WHEN managing users THEN I SHALL be able to update a user's username, nickname, and password.

### Requirement 6: User Accounts & Authentication

**User Story:** As a contributor, I want a secure and flexible way to manage my account and log in, so that my identity is protected.

#### Acceptance Criteria

1.  The login and registration process SHALL be unified, starting with a single input field for a username.
2.  WHEN a user enters an existing username for an account **without** a password and proceeds, THEN the system SHALL log them in directly.
3.  WHEN a user enters an existing username for an account **with** a password, THEN the system SHALL then prompt for the password to complete the login.
4.  WHEN a user enters a new, unused username and proceeds, THEN the system SHALL transition to a registration view, prompting for a nickname and an optional password.
5.  WHEN an account is created THEN it MUST have a globally unique username and nickname.
6.  WHEN an account has no password THEN its username and nickname MUST NOT be the same.
7.  WHEN interacting with the site THEN my username SHALL NOT be displayed publicly; my nickname SHALL be used instead.
8.  WHEN managing my own account THEN I SHALL be able to change my password at any time.
9.  WHEN an account is created THEN the username SHALL be stored as a hash in the database for security.

### Requirement 7: Content Structure

**User Story:** As a content manager, I want to organize articles into categories, so that information is structured and easy to navigate.

#### Acceptance Criteria

1.  WHEN creating or editing an article THEN it MUST be assigned to a category.
2.  WHEN managing categories THEN I SHALL be able to create new categories.
3.  WHEN creating a category THEN I SHALL have the option to place it under another parent category, creating a nested structure.
4.  WHEN managing a category as a Reviewer THEN I SHALL be able to set a default visibility (e.g., 'approved', 'pending') for all new articles created within it.
5.  WHEN a new article is created THEN it SHALL inherit the default visibility from its category, if one is set.

### Requirement 8: Security

**User Story:** As a developer, I want to ensure data is secure and only accessible by authorized users, so that the system's integrity is maintained.

#### Acceptance Criteria

1.  WHEN accessing data THEN access SHALL be controlled by a combination of database views and Row Level Security (RLS) to implement Column Level Security, ensuring users can only see the specific data fields they are permitted to.
2.  WHEN defining security policies THEN they MUST correctly enforce the permissions defined for Visitor, Contributor, Reviewer, and Coordinator roles at both the row and column level.
3.  WHEN handling user credentials THEN passwords and usernames MUST be securely hashed and never stored in plaintext.
