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
  app
    .route("/api/books")
    .get(function (req, res) {
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      try {
        client.connect().then(() => {
          const collection = client.db("fcc_library").collection("books");
          const books = collection.find({}, { comments: 1, title: 1, _id: 1 });
          books.toArray().then((result) => {
            result.forEach((book) => {
              book.commentcount = book?.comments?.length ?? 0;
              delete book.comments;
            });
            return res.send(result);
          });
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
        client.connect().then(() => {
          const collection = client.db("fcc_library").collection("books");
          collection
            .insertOne(newBook)
            .then((doc) => {
              newBook._id = doc.insertedId;
              return res.json(newBook);
            })
            .catch((error) => res.send(error));
        });
      } catch (error) {
        return res.send(error);
      }
    })

    .delete(function (req, res) {
      //if successful response will be 'complete delete successful'
      try {
        client.connect().then(() => {
          const collection = client.db("fcc_library").collection("books");
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
        client.connect().then(() => {
          const collection = client.db("fcc_library").collection("books");
          const book = collection.find(
            {
              _id: ObjectId.createFromHexString(bookid),
            },
            { comments: 1, title: 1, _id: 1 }
          );
          book.toArray().then((result) => {
            console.log("get _id", result);
            if (!result[0]?._id) {
              return res.send("no book exists");
            } else {
              return res.send({ comments: [], ...result[0] });
            }
          });
        });
      } catch (error) {
        return res.send(error);
      }
    })

    .post(function (req, res) {
      let bookid = req.params.id;
      let comment = req.body.comment;
      // console.log({ bookid, comment });
      //json res format same as .get
      if (!comment) {
        return res.send("missing required field comment");
      }
      try {
        client.connect().then(() => {
          const collection = client.db("fcc_library").collection("books");
          bookid = ObjectId.createFromHexString(bookid);
          collection
            .findOneAndUpdate(
              { _id: bookid },
              { $push: { comments: comment } },
              { returnDocument: "after" }
            )
            .then((book) => {
              console.log("post _id", book);
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
        });
      } catch (error) {
        return res.send("no book exists");
      }
    })

    .delete(function (req, res) {
      let bookid = req.params.id;
      //if successful response will be 'delete successful'
      try {
        client.connect().then(() => {
          const collection = client.db("fcc_library").collection("books");
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
        });
      } catch (error) {
        res.send("no book exists");
      }
    });
};
