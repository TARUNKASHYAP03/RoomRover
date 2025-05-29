# RoomRover

RoomRover is an AI-powered room booking platform designed to streamline the process of finding, booking, and managing accommodations. With a modern UI, robust authentication, and features like reviews, bookings, and an integrated chatbot assistant, RoomRover offers a seamless experience for both guests and hosts.

---

## Table of Contents

- [Project Title and Description](#roomrover)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Folder Structure](#folder-structure)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [Contributing Guide](#contributing-guide)
- [License](#license)
- [Contact Information](#contact-information)
- [Acknowledgements](#acknowledgements)

---

## Tech Stack

- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Frontend:** EJS, Bootstrap 5, CSS3, JavaScript
- **Authentication:** Passport.js (Local Strategy)
- **File Uploads:** Multer, Cloudinary
- **Validation:** Joi
- **Session & Flash:** express-session, connect-flash
- **Other:** dotenv, method-override, ejs-mate, sharp

---

## Getting Started

Follow these steps to set up RoomRover locally:

### 1. Clone the Repository

```sh
git clone https://github.com/yourusername/roomrover.git
cd RoomRover
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory and add the following (replace with your actual credentials):

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_KEY=your_cloudinary_key
CLOUDINARY_SECRET=your_cloudinary_secret
SESSION_SECRET=your_session_secret
NODE_ENV=development
```

### 4. Seed the Database (Optional)

To populate the database with sample listings, run:

```sh
nodemon app.js
```

### 5. Run the Project Locally

```sh
npm start
```

The app will be available at [http://localhost:8080](http://localhost:8080).

---

## Usage

- **Browse Listings:** View available rooms and filter by location, price, or guests.
- **Sign Up / Login:** Create an account or log in to book rooms and leave reviews.
- **Book a Room:** Select dates and number of guests to book a listing.
- **Leave Reviews:** Share your experience by leaving a rating and comment.
- **Chatbot:** Use the integrated chatbot for instant help and room search assistance.
- **Profile & Trips:** Manage your bookings and profile information.

### Screenshots

> _Add screenshots of the homepage, booking flow, and chatbot here for better illustration._

---

## Folder Structure

```
RoomRover/
├── app.js                # Main Express app
├── cloudConfig.js        # Cloudinary configuration
├── middleware.js         # Custom middleware (auth, admin, etc.)
├── schema.js             # Joi validation schemas
├── init/                 # Database seeding scripts
├── models/               # Mongoose models (User, Listing, Booking, Review)
├── public/               # Static assets (CSS, JS, images, uploads)
├── routes/               # Express route handlers
├── views/                # EJS templates (layouts, includes, pages)
├── package.json
└── .env
```

- **init/**: Scripts for seeding the database with sample data.
- **models/**: Mongoose schemas for core entities.
- **public/**: Static files served to the client (CSS, JS, images).
- **routes/**: Express routers for different resources.
- **views/**: EJS templates for rendering pages.

---

## Available Scripts

- `npm start` – Start the server on port 8080.
- `npm run dev` – Start the server with nodemon for development (if configured).
- `node init/index.js` – Seed the database with sample listings.

---

## API Reference

### Listings

- `GET /listings`  
  _List all available listings. Supports query params for filtering._

- `GET /listings/:id`  
  _Get details of a specific listing._

- `POST /listings`  
  _Create a new listing (authenticated users only)._

- `PUT /listings/:id`  
  _Edit a listing (admin only)._

- `DELETE /listings/:id`  
  _Delete a listing (admin only)._

### Bookings

- `POST /listings/:id/book`  
  _Book a listing (authenticated users only)._

- `GET /bookings/:bookingId/confirmation`  
  _View booking confirmation._

- `DELETE /bookings/:id`  
  _Cancel a booking (owner only)._

### Reviews

- `POST /listings/:id/reviews`  
  _Add a review to a listing (authenticated users only)._

- `DELETE /listings/:id/reviews/:reviewId`  
  _Delete a review (review author only)._

### Auth

- `GET /signup`, `POST /signup`  
  _User registration._

- `GET /login`, `POST /login`  
  _User login._

- `GET /logout`  
  _User logout._

### Chatbot

- `POST /chatbot`  
  _Send a message to the chatbot.  
  **Request:** `{ "message": "Hello" }`  
  **Response:** `{ "reply": "Hello! How can I help you today?" }`_

---

## Contributing Guide

We welcome contributions! Please follow these guidelines:

- **Fork the repository** and create your branch from `main`.
- **Branch naming:** Use `feature/your-feature`, `bugfix/your-bug`, or `docs/your-docs`.
- **Code style:** Follow the existing code style and use Prettier if available.
- **Pull Requests:**  
  - Reference related issues in your PR.
  - Provide a clear description of your changes.
  - Ensure your code passes all tests and lint checks.
- **Testing:** Add tests for new features where applicable.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Contact Information

- **Author:** [Your Name]
- **Email:** support@roomrover.com
- **GitHub:** [https://github.com/yourusername/roomrover](https://github.com/yourusername/roomrover)

---

## Acknowledgements

- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Bootstrap](https://getbootstrap.com/)
- [Cloudinary](https://cloudinary.com/)
- [Passport.js](http://www.passportjs.org/)
- [Joi](https://joi.dev/)
- Special thanks to all contributors and mentors who helped shape this project.

---

## Additional & Future Updates

We are actively working to improve RoomRover. Planned and potential future enhancements include:

- **Calendar View:** Visualize availability and bookings on a calendar interface.
- **Payment Integration:** Secure online payments for bookings.
- **Host Dashboard:** Analytics and management tools for property owners.
- **Mobile App:** Native mobile applications for iOS and Android.
- **Advanced Search:** More filters (amenities, ratings, etc.) and map-based search.
- **Notifications:** Email and in-app notifications for bookings and messages.
- **Multi-language Support:** Localized UI for a global audience.
- **Accessibility Improvements:** Enhanced support for assistive technologies.
- **API Expansion:** More endpoints and public API documentation.
- **Automated Testing:** Improved test coverage and CI/CD integration.

Have a feature request? [Open an issue](https://github.com/yourusername/roomrover/issues) or contribute directly!

---