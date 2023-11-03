const express = require("express");
const app = express();
const PORT = 3000;
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const dbConnect = async () => {
  mongoose
    .connect(process.env.DB_URL)
    .then(() => {
      console.log(`Successfully Connected to MongoDB `);
    })
    .catch((error) => {
      console.log(`Unable to connect to MongoDB`);
      console.error(error);
    });
};

dbConnect();

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Please provide your Email"],
    unique: true,
  },

  password: {
    type: String,
    required: [true, "Please provide your password"],
    unique: false,
  },
});

const User = mongoose.model("User", UserSchema);

app.get("/", (req, res) => {
  res.send(`Hello World!`);
});

app.post("/register", (req, res) => {
  bcrypt
    .hash(req.body.password, 10)
    .then((hashedPassword) => {
      const user = new User({
        email: req.body.email,
        password: hashedPassword,
      });

      user
        .save()
        .then((result) => {
          res.status(200).send({ message: "User created", result });
        })
        .catch((error) => {
          res.status(500).send({
            message: "Error creating user",
            error,
          });
        });
    })
    .catch((e) => {
      res.status(500).send({
        message: "password was not hashed successfully",
        e,
      });
    });
});

app.post("/login", (req, res) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      bcrypt
        .compare(req.body.password, user.password)
        .then((passwordCheck) => {
          if (!passwordCheck) {
            return res.status(401).status({
              message: "Password does not match",
              error,
            });
          }

          // creating a jwt token

          const token = jwt.sign(
            {
              userId: user._id,
              userEmail: user.email,
            },
            "RANDOM-TOKEN",
            { expiresIn: "24h" }
          );

          res.status(200).send({
            message: "Login Successful",
            email: user.email,
            token,
          });
        })
        .catch((error) => {
          res.status(400).send({
            message: "Incorrect Password ",
            error,
          });
        });
    })
    .catch((e) => {
      res.status(404).send({
        message: "Email not found",
        e,
      });
    });
});

app.listen(PORT, (err) => {
  if (err) {
    return console.error(err);
  }
  console.log(`The backend is running on ${PORT}`);
});
