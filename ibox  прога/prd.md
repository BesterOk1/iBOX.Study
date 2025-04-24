# Product Requirements Document for iBOX Study

## App Overview
- Name: iBOX Study
- Tagline: Master company products with interactive learning
- Category: web_application
- Visual Style: Refined Technical (e.g. Stripe)

## Workflow

1. User registers/logs in with email
2. User browses available courses on dashboard
3. User selects a course and studies the PDF materials
4. User clicks 'Mark as Completed' button after finishing the course
5. Completion status is saved to user profile history
6. Admin can add new courses with PDFs, descriptions, and optional video links

## Application Structure


### Route: /

Login page with email authentication form and welcome information about the platform.


### Route: /dashboard

Main user dashboard showing available courses and navigation to other sections.


### Route: /courses/:courseId

Course detail page with course information, PDF viewer for materials, video links if available, and a 'Mark as Completed' button.


### Route: /profile

User profile page showing personal information and completed courses history.


### Route: /admin

Admin panel for managing courses. Includes a list of existing courses and forms to add/edit courses with title, description, PDF upload, and optional video links.


## Potentially Relevant Utility Functions

### getAuth

Potential usage: Gets authentication information for the current user

Look at the documentation for this utility function and determine whether or not it is relevant to the app's requirements.


----------------------------------

### upload

Potential usage: Uploads files like PDFs to cloud storage and returns a URL

Look at the documentation for this utility function and determine whether or not it is relevant to the app's requirements.
