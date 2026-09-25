let total = 0;

exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ total_builds: total }),
  };
};

exports.config = { path: '/api/stats' };