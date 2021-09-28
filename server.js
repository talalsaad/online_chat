const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const fs = require("fs");

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");
var d = new Date();
const app = express();
const server = http.createServer(app);
const io = socketio(server);
g = ["1", "2", "3"];

// mongodb
const mongoose = require("mongoose");
const { notEqual } = require("assert");
const { time } = require("console");
var MongoClient = require("mongodb").MongoClient;
var url = "mongodb+srv://talalsadd:talalsadd@cluster0.yqsro.mongodb.net/data";
mongoose
  .connect("mongodb+srv://talalsadd:talalsadd@cluster0.yqsro.mongodb.net/data")
  .then(console.log("yes port 3000"));
mongoose.connection.on("connectrd", function () {
  console.log("conected to md");
});

mongoose.connection.on("error", function (error) {
  console.log("error", error);
});
let schema = mongoose.Schema({
  name: String,
  text: String,
  time: String,
  room: String,
});
let Model = mongoose.model("model", schema, "myCollection");

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "ChatCord Bot";

// Run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    geto(user, socket);

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));

    //////// save data to db
    var doc1 = new Model({
      name: user.username,
      text: msg,
      time: d.toLocaleTimeString(),
      room: user.room,
    });

    doc1.save(function (err, doc) {
      if (err) return console.error(err);
      console.log("Document inserted succussfully!");
    });
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// get the data from db
function geto(user, socket) {
  let holder = [];
  MongoClient.connect(url, function (err, client) {
    if (err) throw err;

    var db = client.db("data");

    db.collection("myCollection")
      .find({})
      .toArray(function (err, result) {
        holder = result;
        client.close();

        holder.forEach((element) => {
          if (user.room == element.room) {
            socket.emit("message", formatMessage(element.name, element.text));
          }
        });
        socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));
      });
  });
  function o(user) {
    this.user = user;
  }
}
//download the chat data

app.get("/data.json", (req, res) => {
  savot().then(() => res.send(fs.readFileSync("data_file.json")));
});

async function savot() {
  let holder = [];
  MongoClient.connect(url, function (err, client) {
    if (err) throw err;

    var db = client.db("data");

    db.collection("myCollection")
      .find({})
      .toArray(function (err, result) {
        holder = result;
        fs.writeFile(
          "./data_file.json",
          JSON.stringify(holder, null, 4),
          (err) => {
            if (err) {
              console.error(err);
              return;
            }
            console.log("File has been created");
          }
        );
        client.close();
      });
  });

  await sleep(3000);
}
// sleep function to give  the server time  to creat json file befour download the file
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
