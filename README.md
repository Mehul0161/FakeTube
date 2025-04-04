# FakeTube

A YouTube-like platform built with React.js, Node.js, and MongoDB.

## Features

- User Authentication & Profiles
- Video Management (Upload, Edit, Delete)
- Video Playback & Streaming
- Engagement Features (Likes, Comments, Shares)
- Search & Recommendations
- Monetization Options
- Admin Dashboard
- Notifications & History

## Tech Stack

- Frontend: React.js
- Backend: Node.js with Express.js
- Database: MongoDB Atlas
- Storage: Cloudinary
- Authentication: Firebase Auth

## Project Structure

```
faketube/
├── client/                 # Frontend React application
├── server/                 # Backend Node.js/Express application
├── .env                    # Environment variables
└── README.md              # Project documentation
```

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_atlas_uri
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   FIREBASE_APP_ID=your_firebase_app_id
   ```

4. Start the development servers:
   ```bash
   # Start backend server
   cd server
   npm run dev

   # Start frontend server
   cd ../client
   npm start
   ```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 