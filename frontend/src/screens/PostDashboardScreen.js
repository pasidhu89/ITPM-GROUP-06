import React, { useContext, useEffect, useReducer } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import { toast } from 'react-toastify';
import { Store } from '../Store';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { getError } from '../utils';

import Chart from 'react-google-charts';
import Card from 'react-bootstrap/Card';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        posts: action.payload.posts,
        page: action.payload.page,
        pages: action.payload.pages,
        loading: false,
      };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    case 'CREATE_REQUEST':
      return { ...state, loadingCreate: true };
    case 'CREATE_SUCCESS':
      return {
        ...state,
        loadingCreate: false,
      };
    case 'CREATE_FAIL':
      return { ...state, loadingCreate: false };

    case 'DELETE_REQUEST':
      return { ...state, loadingDelete: true, successDelete: false };
    case 'DELETE_SUCCESS':
      return {
        ...state,
        loadingDelete: false,
        successDelete: true,
      };
    case 'DELETE_FAIL':
      return { ...state, loadingDelete: false, successDelete: false };

    case 'DELETE_RESET':
      return { ...state, loadingDelete: false, successDelete: false };

    case 'PIE_FETCH_REQUEST':
      return { ...state, loading: true };
    case 'PIE_FETCH_SUCCESS':
      return {
        ...state,
        summary: action.payload,
        loading: false,
      };
    case 'PIE_FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};

export default function PostDashboardScreen() {
  const [
    {
      summary,
      loading,
      error,
      posts,
      pages,
      loadingCreate,
      loadingDelete,
      successDelete,
    },
    dispatch,
  ] = useReducer(reducer, {
    loading: true,
    error: '',
  });

  const navigate = useNavigate();
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const page = sp.get('page') || 1;

  const { state } = useContext(Store);
  const { userInfo } = state;
  // todo....................................................................................
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const { data } = await axios.get(`/api/posts/admin?page=${page} `, {
  //         headers: { Authorization: `Bearer ${userInfo.token}` },
  //       });

  //       dispatch({ type: 'FETCH_SUCCESS', payload: data });
  //     } catch (err) {}
  //   };

  //   if (successDelete) {
  //     dispatch({ type: 'DELETE_RESET' });
  //   } else {
  //     fetchData();
  //   }
  // }, [page, userInfo, successDelete]);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const { data } = await axios.get('/api/posts/summary', {
  //         headers: { Authorization: `Bearer ${userInfo.token}` },
  //       });
  //       dispatch({ type: 'PIE_FETCH_SUCCESS', payload: data });
  //     } catch (err) {
  //       dispatch({
  //         type: 'PIE_FETCH_FAIL',
  //         payload: getError(err),
  //       });
  //     }
  //   };
  //   fetchData();
  // }, [userInfo]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [adminResponse, summaryResponse] = await Promise.all([
          axios.get(`/api/posts/admin?page=${page}`, {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          }),
          axios.get('/api/posts/summary', {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          }),
        ]);

        dispatch({ type: 'FETCH_SUCCESS', payload: adminResponse.data });
        dispatch({ type: 'PIE_FETCH_SUCCESS', payload: summaryResponse.data });
      } catch (err) {
        dispatch({
          type: 'PIE_FETCH_FAIL',
          payload: getError(err),
        });
      }
    };

    if (successDelete) {
      dispatch({ type: 'DELETE_RESET' });
    } else {
      fetchData();
    }
  }, [page, userInfo, successDelete]);

  const deleteHandler = async (post) => {
    if (window.confirm('Are you sure to delete?')) {
      try {
        await axios.delete(`/api/posts/${post._id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        toast.success('post deleted successfully');
        dispatch({ type: 'DELETE_SUCCESS' });
      } catch (err) {
        toast.error(getError(error));
        dispatch({
          type: 'DELETE_FAIL',
        });
      }
    }
  };

  return (
    <div>
      <Row>
        <h1>Dashboard</h1>

        <Col>
          <h1>Posts</h1>
        </Col>
      </Row>

      {loadingCreate && <LoadingBox></LoadingBox>}
      {loadingDelete && <LoadingBox></LoadingBox>}

      {loading ? (
        <LoadingBox />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <>
          <Row>
            <Col md={4}>
              <Card>
                <Card.Body>
                  <Card.Title>
                    {summary.users && summary.users[0]
                      ? summary.users[0].numUsers
                      : 0}
                  </Card.Title>
                  <Card.Text> Users</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <br />
          <br />

          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>CAPTION</th>
                <th>TYPE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {posts.map((post) => (
                <tr key={post._id}>
                  <td>{post._id}</td>
                  <td>{post.caption}</td>
                  <td>{post.type}</td>

                  <td>
                    <Button
                      type="button"
                      variant="light"
                      onClick={() => navigate(`/userpost/${post._id}`)}
                    >
                      Edit
                    </Button>
                    &nbsp;
                    <Button
                      type="button"
                      variant="light"
                      onClick={() => deleteHandler(post)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            {[...Array(pages).keys()].map((x) => (
              <Link
                className={x + 1 === Number(page) ? 'btn text-bold' : 'btn'}
                key={x + 1}
                to={`/userposts?page=${x + 1}`}
              >
                {x + 1}
              </Link>
            ))}
          </div>

          <div className="my-3">
            <h2>Types</h2>
            {summary.types.length === 0 ? (
              <MessageBox>No Category</MessageBox>
            ) : (
              <Chart
                width="100%"
                height="400px"
                chartType="PieChart"
                loader={<div>Loading Chart...</div>}
                data={[
                  ['Type', 'Posts'],
                  ...summary.types.map((x) => [x._id, x.count]),
                ]}
                options={{
                  pieHole: 0.5,
                  colors: [
                    '#A1DC67',
                    '#39CEF3',
                    '#FF4906',
                    '#33FF9F',
                    '#FF5722',
                  ],
                  // slices: {
                  //   0: { offset: 0.1 }, // add 10% offset to the first slice
                  //   1: { offset: 0.05 }, // add 5% offset to the second slice
                  // },
                }}
              ></Chart>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// import React, { useContext, useEffect, useReducer } from 'react';
// import Chart from 'react-google-charts';
// import axios from 'axios';
// import { Store } from '../Store';
// import { getError } from '../utils';
// import LoadingBox from '../components/LoadingBox';
// import MessageBox from '../components/MessageBox';
// import Row from 'react-bootstrap/Row';
// import Col from 'react-bootstrap/Col';
// import Card from 'react-bootstrap/Card';

// const reducer = (state, action) => {
//   switch (action.type) {
//     case 'FETCH_REQUEST':
//       return { ...state, loading: true };
//     case 'FETCH_SUCCESS':
//       return {
//         ...state,
//         summary: action.payload,
//         loading: false,
//       };
//     case 'FETCH_FAIL':
//       return { ...state, loading: false, error: action.payload };
//     default:
//       return state;
//   }
// };
// export default function PostDashboardScreen() {
//   const [{ loading, summary, error }, dispatch] = useReducer(reducer, {
//     loading: true,
//     error: '',
//   });
//   const { state } = useContext(Store);
//   const { userInfo } = state;

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const { data } = await axios.get('/api/posts/summary', {
//           headers: { Authorization: `Bearer ${userInfo.token}` },
//         });
//         dispatch({ type: 'FETCH_SUCCESS', payload: data });
//       } catch (err) {
//         dispatch({
//           type: 'FETCH_FAIL',
//           payload: getError(err),
//         });
//       }
//     };
//     fetchData();
//   }, [userInfo]);

//   return (
//     <div>
//       <h1>Dashboard</h1>
//       {loading ? (
//         <LoadingBox />
//       ) : error ? (
//         <MessageBox variant="danger">{error}</MessageBox>
//       ) : (
//         <>
//                   <div className="my-3">
//             <h2>Types</h2>
//             {summary.types.length === 0 ? (
//               <MessageBox>No Category</MessageBox>
//             ) : (
//               <Chart
//                 width="100%"
//                 height="400px"
//                 chartType="PieChart"
//                 loader={<div>Loading Chart...</div>}
//                 data={[
//                   ['Type', 'Posts'],
//                   ...summary.types.map((x) => [x._id, x.count]),
//                 ]}
//               ></Chart>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }