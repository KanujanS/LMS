# LearnGate 🎓

A full-stack Learning Management System (LMS) that connects educators and students. Educators can create and publish courses, while students can browse, enroll, and track their learning progress.

🌐 **Live Demo:** [Deployed on Vercel](https://lms-client-delta.vercel.app)

---

## Features

### For Students
- Browse and search courses by category or keyword
- View detailed course information with free preview lectures
- Secure enrollment via Stripe payment
- Watch lectures with a built-in video player
- Track course completion progress
- Manage all enrolled courses from a personal dashboard

### For Educators
- Dedicated educator dashboard with analytics
- Create courses with rich text descriptions (Quill editor)
- Organize content into chapters and lectures
- Upload course thumbnails and lecture videos (Cloudinary)
- Set course pricing and discount rates
- View enrolled students per course

### General
- JWT-based authentication
- Protected routes for students and educators
- Responsive UI built with Tailwind CSS
- Stripe webhook integration for payment verification

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite | Build tool |
| Tailwind CSS 4 | Styling |
| React Router DOM 7 | Client-side routing |
| Axios | HTTP client |
| Stripe.js | Payment UI |
| Quill | Rich text editor |
| React YouTube | Video player |
| React Hot Toast | Notifications |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose | Database |
| Cloudinary | Media storage (images & videos) |
| Stripe | Payment processing |
| Svix | Webhook verification |
| JWT | Authentication tokens |
| Multer | File upload handling |
| bcryptjs | Password hashing |

---

## Project Structure

```
LearnGate/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/        # ProtectedRoute component
│   │   │   ├── educator/    # Educator-specific components
│   │   │   └── student/     # Student-specific components (Navbar, etc.)
│   │   ├── context/         # React context (auth, app state)
│   │   ├── pages/
│   │   │   ├── educator/    # Dashboard, AddCourse, MyCourses, StudentsEnrolled
│   │   │   └── student/     # Home, CoursesList, CourseDetails, Player, MyEnrollments
│   │   └── utils/           # Helper functions
│   └── vercel.json          # Vercel SPA rewrite config
│
└── server/                  # Express backend
    ├── configs/             # MongoDB, Cloudinary, Multer config
    ├── controllers/         # Route handlers (user, educator, course, webhooks)
    ├── middlewares/         # Auth middleware
    ├── models/              # Mongoose models (User, Course, Purchase, CourseProgress)
    ├── routes/              # API routes
    ├── server.js            # Entry point
    └── vercel.json          # Vercel serverless config
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account
- Stripe account
- Clerk account (for webhook events)

### 1. Clone the repository

```bash
git clone https://github.com/KanujanS/LMS.git
cd LMS
```

### 2. Setup the Backend

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
SVIX_SECRET=your_svix_secret
```

Start the server:

```bash
npm run server   # development (nodemon)
npm start        # production
```

The API will be available at `http://localhost:5001`.

### 3. Setup the Frontend

```bash
cd client
npm install
```

Create a `.env` file in the `client/` directory:

```env
VITE_BACKEND_URL=http://localhost:5001
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## API Endpoints

### User
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/user/register` | Register a new user |
| POST | `/api/user/login` | Login and get JWT token |
| GET | `/api/user/data` | Get current user data |
| GET | `/api/user/purchased-courses` | Get enrolled courses |

### Courses
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/course/all` | Get all published courses |
| GET | `/api/course/:id` | Get course details |
| POST | `/api/course/purchase` | Initiate course purchase |

### Educator
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/educator/dashboard` | Get educator stats |
| POST | `/api/educator/add-course` | Create a new course |
| GET | `/api/educator/courses` | Get educator's courses |
| GET | `/api/educator/students` | Get enrolled students |

### Webhooks
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/webhook/stripe` | Stripe payment webhook |

---

## Deployment

Both the frontend and backend are deployed on **Vercel**.

- **Frontend** (`client/vercel.json`): Configured with SPA rewrites so all routes serve `index.html`.
- **Backend** (`server/vercel.json`): Configured as a serverless Node.js function using `@vercel/node`.

---

## License

This project is open source and available under the [MIT License](LICENSE).
