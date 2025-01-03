# Video Streaming Platform Prototype - Backend Implementation

## Project Overview

This project is a prototype of a video streaming platform's backend implementation, built using Node.js, Express.js, and MongoDB, with secure media storage via Cloudinary. The application features user authentication, and models for user, video, likes, tweets, and comments, all interrelated. Media files are optimized using Cloudinary and managed with Multer.

## Technologies Used

- **Node.js**: JavaScript runtime environment for server-side development.
- **Express.js**: Web framework for Node.js to build web applications and APIs.
- **MongoDB**: NoSQL database for storing application data.
- **Cloudinary**: Cloud storage solution for image and video files.
- **Multer**: Middleware for handling `multipart/form-data` for file uploads.
- **JWT**: JSON Web Tokens for secure user authentication.

## Models

### User Model
Represents the users in the system, including fields for user information and authentication details.

### Video Model
Represents the video files uploaded by users, including metadata such as title, description, and Cloudinary URLs.

### Like Model
Tracks the likes on videos, associated with both users and videos.

### Tweet Model
Represents short text posts (tweets) related to the videos, associated with both users and videos.

### Comment Model
Tracks user comments on videos, related to both users and videos.

## Functionalities

### User Authentication
- **Registration**: Users can register by providing necessary details. The system securely hashes and stores passwords.
- **Login**: Registered users can log in using their credentials, receiving a JWT token for secure access.
- **Authorization**: Protected routes ensure only authenticated users can access certain functionalities.

### Video Management
- **Upload**: Users can upload video files. Videos are stored in Cloudinary for optimized performance, with metadata stored in MongoDB.
- **Processing**: Videos are processed to ensure compatibility and optimized storage.
- **Playback**: Users can stream videos directly from Cloudinary.

### Interactions
- **Likes**: Users can like videos, and the like count is updated in real-time.
- **Tweets**: Users can post short messages (tweets) related to videos.
- **Comments**: Users can comment on videos, fostering discussion and engagement.

### Data Relationships
The models are interrelated, ensuring comprehensive data management:
- **Users** have multiple **Videos**.
- **Videos** can have multiple **Likes**, **Tweets**, and **Comments**.
- **Likes**, **Tweets**, and **Comments** are associated with both **Users** and **Videos**.

## Data Storage and Optimization
- **MongoDB**: Stores structured data such as user information, video metadata, likes, tweets, and comments.
- **Cloudinary**: Stores media files (videos and images), optimizing for storage and retrieval performance.
- **Multer**: Handles file uploads from users to Cloudinary, ensuring smooth and efficient media management.

