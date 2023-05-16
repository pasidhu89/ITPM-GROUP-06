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
import SearchBox from '../components/SearchBox';

import Chart from 'react-google-charts';
import Card from 'react-bootstrap/Card';
import { faBorderTopLeft } from '@fortawesome/free-solid-svg-icons';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';



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
const generateReport = () => {
  const element = document.getElementById('chartContainer');

  if (!element) {
    console.error('Element not found!');
    return;
  }

  const { offsetWidth, offsetHeight } = element;

  html2canvas(element, { width: offsetWidth, height: offsetHeight }).then((canvas) => {
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF();
    pdf.addImage(imgData, 'PNG', 0, 0);
    pdf.save('report.pdf');
  });
};

// const generateReport = () => {
//   // Get the target element to capture as a screenshot (in this case, the whole document body)
//   const targetElement = document.body;

//   // Use html2canvas to capture a screenshot of the target element
//   html2canvas(targetElement).then((canvas) => {
//     // Create a new jsPDF instance
//     const pdf = new jsPDF();

//     // Calculate the width and height of the PDF document based on the captured screenshot
//     const pdfWidth = pdf.internal.pageSize.getWidth();
//     const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

//     // Add the captured screenshot as an image to the PDF document
//     pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 0, 0, pdfWidth, pdfHeight);

//     // Download the PDF document with the captured screenshot
//     pdf.save('report.pdf');
//   });
// };

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
    <div id='chartContainer'>
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
          <div
            style={{
              paddingTop: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 14px',
              height: '70px',
              borderTopLeftRadius: '15px',
              borderTopRightRadius: '15px',
            }}
          >
            <div
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '21px',
                fontWeight: '600',
                color: '#000000',
              }}
            >
              Stories
            </div>
            <button
              style={{
                backgroundColor: ' #3AD784',
                color: '#FFFFFF',
                borderRadius: '10px',
                fontSize: '16px',
                height: '32px',
                width: '140px',
                textAlign: 'center',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={generateReport}>
              Generate report
            </button>
            <div style={{ paddingRight: '80px', paddingBottom: '10px' }}>
              <SearchBox />
            </div>
          </div>
          <table
            className="table"
            style={{
              backgroundColor: '#FFFDFD',
              borderRadius: '12px',
              boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 14px',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#2A3042',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '17px',
                  fontWeight: '600',
                  color: '#FEFEFE',
                }}
              >
                <th>ID</th>
                <th>CAPTION</th>
                <th>LOCATION</th>
                <th>TYPE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '15px',
                fontWeight: '400 ',
                color: '#575757',
              }}
            >
              {posts.map((post) => (
                <tr key={post._id}>
                  <td>{post._id}</td>
                  <td>{post.caption}</td>
                  <td>{post.location}</td>
                  <td>
                    <div
                      style={{
                        width: '110PX',
                        height: '40PX',
                        boxShadow: '4px 4px 20px rgba(0, 0, 0, 0.3)',
                        color:
                          post.type === 'complain'
                            ? '#CD2B2B'
                            : post.type === 'compliment'
                            ? '#2BCD7F'
                            : '#2B6CCD',
                        backgroundColor:
                          post.type === 'complain'
                            ? '#EEDED4'
                            : post.type === 'compliment'
                            ? '#D4EEE2'
                            : '#D4E6EE',
                        textAlign: 'center',
                        lineHeight: '40px',
                        fontWeight: '400',
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '14px',
                        borderRadius: '10px',
                      }}
                    >
                      {post.type === 'complain'
                        ? 'Complain'
                        : post.type === 'compliment'
                        ? 'Compliment'
                        : 'Other'}
                    </div>
                  </td>

                  <td>
                    <Button
                      type="button"
                      style={{
                        borderRadius: '35px',
                        backgroundColor: '#007BFF',
                        color: '#FFFFFF',
                        width: '100px',
                      }}
                      onClick={() => navigate(`/userpost/${post._id}`)}
                    >
                      View
                    </Button>
                    &nbsp;
                    <Button
                      type="button"
                      style={{
                        borderRadius: '35px',
                        backgroundColor: '#007BFF',
                        color: '#FFFFFF',
                        width: '100px',
                      }}
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
                height="600px"
                chartType="PieChart"
                loader={<div>Loading Chart...</div>}
                data={[
                  ['Type', 'Posts'],
                  ...summary.types.map((x) => [x._id, x.count]),
                ]}
                options={{
                  pieHole: 0.5,
                  is3D: true,
                  colors: [
                    '#A1DC67',
                    '#39CEF3',
                    '#FF4906',
                    '#33FF9F',
                    '#FF5722',
                  ],
                }}
              ></Chart>
            )}
          </div>
          <div className=" my-3" >
            <h2>Daily posts</h2>
            {summary.dailyPosts.length === 0 ? (
              <MessageBox>No Sale</MessageBox>
            ) : (
              <Chart
                width="100%"
                height="400px"
                chartType="Line"
                loader={<div>Loading Chart...</div>}

                data={[
                  ['Date', 'Complain', 'Compliment', 'Other'],
                  ...summary.dailyPosts.map((x) => [
                    x._id,
                    x.complain,
                    x.compliment,
                    x.other,
                  ]),
                ]}

              ></Chart>
            )}
          </div>
        </>
      )}
    </div>
  );
}
