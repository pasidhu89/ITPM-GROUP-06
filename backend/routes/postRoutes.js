import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Post from '../models/postModel.js';
import { isAuth, isAdmin } from '../utils.js';

const postRouter = express.Router();

postRouter.get('/', async (req, res) => {
  const posts = await Post.find();
  res.send(posts);
});

postRouter.post(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const newPost = new Post({
      caption: 'sample name ' + Date.now(),
      image: '/images/p1.jpg',
      description: 'sample description',
      type: 'sample category',
      location: 'sample location',
      rating: 0,
      numReviews: 0,
    });
    const post = await newPost.save();
    res.send({ message: 'Post Created', post });
  })
);

postRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (post) {
      post.caption = req.body.caption;
      post.image = req.body.image;
      post.images = req.body.images;
      post.description = req.body.description;
      post.type = req.body.type;
      post.location = req.body.location;

      await post.save();
      res.send({ message: 'Post Updated' });
    } else {
      res.status(404).send({ message: 'Post Not Found' });
    }
  })
);

postRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (post) {
      await post.remove();
      res.send({ message: 'Post Deleted' });
    } else {
      res.status(404).send({ message: 'Post Not Found' });
    }
  })
);

postRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (post) {
      if (post.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }

      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      post.reviews.push(review);
      post.numReviews = post.reviews.length;
      post.rating =
        post.reviews.reduce((a, c) => c.rating + a, 0) / post.reviews.length;
      const updatedPost = await post.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedPost.reviews[updatedPost.reviews.length - 1],
        numReviews: post.numReviews,
        rating: post.rating,
      });
    } else {
      res.status(404).send({ message: 'Post Not Found' });
    }
  })
);

const PAGE_SIZE = 3;

postRouter.get(
  '/admin',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;

    const posts = await Post.find()
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    const countPosts = await Post.countDocuments();
    res.send({
      posts,
      countPosts,
      page,
      pages: Math.ceil(countPosts / pageSize),
    });
  })
);

postRouter.get(
  '/search',
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const pageSize = query.pageSize || PAGE_SIZE;
    const page = query.page || 1;
    const type = query.type || '';
    const rating = query.rating || '';
    const searchQuery = query.query || '';

    const queryFilter =
      searchQuery && searchQuery !== 'all'
        ? {
            caption: {
              $regex: searchQuery,
              $options: 'i',
            },
          }
        : {};
    const typeFilter = type && type !== 'all' ? { type } : {};

    const ratingFilter =
      rating && rating !== 'all'
        ? {
            rating: {
              $gte: Number(rating),
            },
          }
        : {};

    const sortOrder =
      order === 'featured'
        ? { featured: -1 }
        : order === 'toprated'
        ? { rating: -1 }
        : order === 'newest'
        ? { createdAt: -1 }
        : { _id: -1 };

    const posts = await Post.find({
      ...queryFilter,
      ...typeFilter,
      ...ratingFilter,
    })
      .sort(sortOrder)
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    const countPosts = await Post.countDocuments({
      ...queryFilter,
      ...typeFilter,
      ...ratingFilter,
    });
    res.send({
      posts,
      countPosts,
      page,
      pages: Math.ceil(countPosts / pageSize),
    });
  })
);

postRouter.get(
  '/types',
  expressAsyncHandler(async (req, res) => {
    const types = await Post.find().distinct('type');
    res.send(types);
  })
);

postRouter.get('/:id', async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (post) {
    res.send(post);
  } else {
    res.status(404).send({ message: 'Post Not Found' });
  }
});

export default postRouter;