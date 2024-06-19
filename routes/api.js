/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";
const { MongoClient, ObjectId } = require("mongodb");

module.exports = function (app) {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  client.connect((err) => {
    if (err) {
      console.error("Error connecting to MongoDB:", err);
      return;
    }
    console.log("Connected to MongoDB");
  });
  const db = client.db("fcc_library"); // Replace 'mydb' with your database name
  const collection = db.collection("books");
  app
    .route("/api/books")
    .get(function (req, res) {
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      try {
        const books = collection.find({}, { comments: 1, title: 1, _id: 1 });
        books.toArray().then((result) => {
          result.forEach((book) => {
            book.commentcount = book?.comments?.length ?? 0;
            delete book.comments;
          });
          return res.send(result);
        });
      } catch (error) {
        return res.send(error);
      }
    })

    .post(function (req, res) {
      let title = req.body.title;
      //response will contain new book object including atleast _id and title
      if (!title) {
        return res.send("missing required field title");
      }
      const newBook = {
        title: title,
      };
      try {
        collection
          .insertOne(newBook)
          .then((doc) => {
            newBook._id = doc.insertedId;
            return res.json(newBook);
          })
          .catch((error) => res.send(error));
      } catch (error) {
        return res.send(error);
      }
    })

    .delete(function (req, res) {
      //if successful response will be 'complete delete successful'
      try {
        collection
          .deleteMany({})
          .then((doc) => {
            if (!doc) {
              return res.send("could not delete");
            } else {
              return res.send("complete delete successful");
            }
          })
          .catch((error) => {
            return res.send("could not delete");
          });
      } catch (error) {
        return res.send("could not delete");
      }
    });

  app
    .route("/api/books/:id")
    .get(function (req, res) {
      let bookid = req.params.id;
      if (!bookid) {
        return res.send("missing required field id");
      }
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      try {
        const book = collection.find(
          {
            _id: ObjectId.createFromHexString(bookid),
          },
          { comments: 1, title: 1, _id: 1 }
        );
        book.toArray().then((result) => {
          if (!result[0]?._id) {
            return res.send("no book exists");
          } else {
            return res.send({ comments: [], ...result[0] });
          }
        });
      } catch (error) {
        return res.send(error);
      }
    })

    .post(function (req, res) {
      let bookid = req.params.id;
      let comment = req.body.comment;
      //json res format same as .get
      if (!comment) {
        return res.send("missing required field comment");
      }
      try {
        bookid = ObjectId.createFromHexString(bookid);
        collection
          .findOneAndUpdate(
            { _id: bookid },
            { $push: { comments: comment } },
            { returnDocument: "after" }
          )
          .then((book) => {
            if (!book) {
              return res.send("no book exists");
            } else {
              const result = {
                _id: book._id.toString(),
                title: book.title,
                comments: book.comments ?? [],
              };
              return res.json(result);
            }
          })
          .catch((error) => {
            return res.send("no book exists");
          });
      } catch (error) {
        return res.send("no book exists");
      }
    })

    .delete(function (req, res) {
      let bookid = req.params.id;
      //if successful response will be 'delete successful'
      try {
        bookid = ObjectId.createFromHexString(bookid);
        collection
          .deleteOne({ _id: bookid })
          .then((doc) => {
            if (doc.deletedCount < 1) {
              return res.send("no book exists");
            }
            return res.send("delete successful");
          })
          .catch((error) => {
            return res.send("could not delete");
          });
      } catch (error) {
        res.send("no book exists");
      }
    });
};
