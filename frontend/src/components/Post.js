import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';
import Rating from './Rating';
import axios from 'axios';
import { useContext } from 'react';
import { Store } from '../Store';

function Post(props) {
  const { post } = props;

  return (
    <Card>
      <Link to={`/post/${post._id}`}>
        <img
          src={post.image}
          className="card-img-top"
          alt={post.caption}
          style={{ height: '375px' }} 
        />
      </Link>

      <Card.Body>
        <Link to={`/post/${post._id}`}>
          <Card.Title>{post.caption}</Card.Title>
        </Link>

        <Card.Text>
          {post.description.split(' ').slice(0, 15).join(' ')}...
        </Card.Text>

        <Rating rating={post.rating} numReviews={post.numReviews} />

        <Card.Text>{post.location}</Card.Text>

        {/* <Card.Text>{post.type}</Card.Text> */}
        <Link to={`/post/${post._id}`}>
          <button className="btn btn-primary">Read More</button>
        </Link>
      </Card.Body>
    </Card>
  );
}
export default Post;
