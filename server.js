const express = require("express");
const bodyParser = require("body-parser");
const path = require('path');
const nodemailer = require("nodemailer");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();

const allowedOrigins = [
  "https://pratham2236.github.io",
  "http://localhost:3000",
  "http://localhost:5001",
  "https://shiny-invention-v6pp47j45gwqf6wqv-3000.app.github.dev"
];

app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(bodyParser.json());

const port = 5005;

// Use environment variable for MongoDB URI
const mongoURI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(mongoURI)
.then(() => {
  console.log('Connected to MongoDB Atlas');
})
.catch((error) => {
  console.error('Error connecting to MongoDB Atlas:', error);
});

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('Error connecting to MongoDB Atlas:', error);
});

const reservationSchema = new mongoose.Schema({
  name: String,
  email: String,
  date: String,
  time: String,
  members: Number,
  number: Number,
});

const reservation = mongoose.model('reservation', reservationSchema);

const feedbackSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

app.post("/send-email", async (req, res) => {
  const { name, email, date, time, members, number } = req.body;

  const newReservation = new reservation({ name, email, date, time, members, number });

  try {
    await newReservation.save();
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Table Reservation Confirmation",
      html: `
        <p>Dear <strong>${name}</strong>,</p>
        <p>Thank you for choosing our restaurant. We are pleased to confirm your table reservation for <span style="color:#ff4d00">${members}</span> members as follows:</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p>We look forward to serving you and hope you have a wonderful dining experience with us.</p>
        <p>Best regards,</p>
        <p>SilverSpoon Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
    res.status(200).send("Reservation saved and email sent successfully");
  } catch (error) {
    console.error("Error saving reservation:", error);
    res.status(500).send("Error saving reservation: " + error.message);
  }
});

app.post("/submit-feedback", (req, res) => {
  const { feedname, feedemail, feedmessage } = req.body;

  const newFeedback = new Feedback({ name: feedname, email: feedemail, message: feedmessage });

  newFeedback.save()
    .then(() => {
      res.status(200).send("Feedback stored successfully");
    })
    .catch((err) => {
      console.error("Error storing feedback:", err);
      res.status(500).send("Error storing feedback: " + err.message);
    });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
