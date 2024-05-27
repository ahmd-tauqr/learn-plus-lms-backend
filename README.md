# Learn Plus LMS Backend

## Overview
Learn Plus LMS Backend is a learning management system for managing courses and lessons, built using NestJS, TypeORM, and PostgreSQL. This backend application provides APIs for user authentication, course management, lesson management, and enrollment management.

## Table of Contents
1. [TL;DR](#tldr)
2. [Setup](#setup)
3. [Running the Application](#running-the-application)
4. [Testing](#testing)
5. [API Endpoints](#api-endpoints)
   - [Authentication](#authentication)
   - [Courses](#courses)
   - [Enrollments](#enrollments)

## TL;DR

1. **Clone the repository:**
   ```sh
   git clone <repository-url>
   cd learn-plus-lms-backend
   ```

2. **Install dependencies:**
   ```sh
   yarn install
   ```

3. **Setup environment variables:**
   Create a `.env.stage.dev` file based on the `.env.example` file.

4. **Run the application:**
   ```sh
   yarn start:dev
   ```

5. **Run tests:**
   ```sh
   yarn test:dev
   ```

## Setup

### Prerequisites
- Node.js (v14 or higher)
- Yarn (v1.22 or higher)
- PostgreSQL

### Installation

1. **Clone the repository:**
   ```sh
   git clone <repository-url>
   cd learn-plus-lms-backend
   ```

2. **Install dependencies:**
   ```sh
   yarn install
   ```

3. **Setup environment variables:**
   Create a `.env.stage.dev` file based on the `.env.example` file and configure it with your PostgreSQL database credentials.

   Example:
   ```env
   STAGE=dev
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_DATABASE=your_database
   JWT_SECRET=keepitverysecret!!
   ```

### Database Setup
1. **Create a PostgreSQL database:**
   ```sh
   createdb learn_plus_lms
   ```

2. **Run database migrations (if any):**
   ```sh
   yarn typeorm migration:run
   ```

## Running the Application

### Development
To run the application in development mode with hot-reloading:
```sh
yarn start:dev
```

### Production
To run the application in production mode:
```sh
yarn build
yarn start:prod
```

## Testing
To run the test suite:
```sh
yarn test:dev
```

To run tests in watch mode:
```sh
yarn test:watch
```

To generate test coverage report:
```sh
yarn test:cov
```

## API Endpoints

### Authentication

#### Sign Up
- **Endpoint:** `POST /auth/signup`
- **Description:** Create a new user.
- **Body:**
  ```json
  {
    "username": "testuser",
    "password": "password"
  }
  ```
- **Response:**
  - `201 Created` on success
  - `409 Conflict` if username already exists

#### Sign In
- **Endpoint:** `POST /auth/signin`
- **Description:** Sign in a user.
- **Body:**
  ```json
  {
    "username": "testuser",
    "password": "password"
  }
  ```
- **Response:**
  - `200 OK` with access token cookie on success
  - `401 Unauthorized` on invalid credentials

### Courses

#### Get All Courses
- **Endpoint:** `GET /courses`
- **Description:** Retrieve all courses.
- **Response:**
  - `200 OK` with list of courses

#### Get Course by ID
- **Endpoint:** `GET /courses/:id`
- **Description:** Retrieve a course by its ID.
- **Response:**
  - `200 OK` with course details
  - `404 Not Found` if course does not exist

#### Create Course
- **Endpoint:** `POST /courses`
- **Description:** Create a new course.
- **Body:**
  ```json
  {
    "title": "New Course",
    "description": "Course description",
    "tags": ["tag1", "tag2"],
    "lessons": [
      {
        "title": "Lesson 1",
        "description": "Lesson 1 description"
      }
    ]
  }
  ```
- **Response:**
  - `201 Created` on success

#### Add Lesson to Course
- **Endpoint:** `POST /courses/:id/lessons`
- **Description:** Add a lesson to an existing course.
- **Body:**
  ```json
  {
    "title": "New Lesson",
    "description": "Lesson description"
  }
  ```
- **Response:**
  - `201 Created` on success

#### Delete Course
- **Endpoint:** `DELETE /courses/:id`
- **Description:** Delete a course by its ID.
- **Response:**
  - `200 OK` on success
  - `404 Not Found` if course does not exist

#### Delete Lesson
- **Endpoint:** `DELETE /courses/:id/lessons/:lessonId`
- **Description:** Delete a lesson by its ID from a course.
- **Response:**
  - `200 OK` on success
  - `404 Not Found` if lesson does not exist

### Enrollments

#### Enroll to Course
- **Endpoint:** `POST /auth/enroll/:courseId`
- **Description:** Enroll the authenticated user to a course.
- **Response:**
  - `201 Created` on success
  - `404 Not Found` if course does not exist

#### Unenroll from Course
- **Endpoint:** `DELETE /auth/unenroll/:enrollmentId`
- **Description:** Unenroll the authenticated user from a course.
- **Response:**
  - `200 OK` on success
  - `404 Not Found` if enrollment does not exist

#### Get Enrollments
- **Endpoint:** `GET /auth/enrollments`
- **Description:** Retrieve all enrollments for the authenticated user.
- **Response:**
  - `200 OK` with list of enrollments

#### Get Enrollment Details
- **Endpoint:** `GET /auth/enrollments/:enrollmentId`
- **Description:** Retrieve details of a specific enrollment.
- **Response:**
  - `200 OK` with enrollment details
  - `404 Not Found` if enrollment does not exist

#### Update Enrollment Progress
- **Endpoint:** `PATCH /auth/enrollments/:enrollmentId/progress`
- **Description:** Update the progress of an enrollment.
- **Body:**
  ```json
  {
    "progress": 50
  }
  ```
- **Response:**
  - `200 OK` on success
  - `404 Not Found` if enrollment does not exist

#### Complete Lesson
- **Endpoint:** `PATCH /auth/enrollments/:enrollmentId/lessons/:lessonId/complete`
- **Description:** Mark a lesson as completed for an enrollment.
- **Response:**
  - `200 OK` on success
  - `404 Not Found` if lesson progress does not exist

## Conclusion
This documentation provides a comprehensive guide to setting up, running, and interacting with the Learn Plus LMS Backend. The API endpoints are designed to cover all necessary operations for managing courses, lessons, and enrollments. For any additional information or support, please refer to the project repository or contact the author.