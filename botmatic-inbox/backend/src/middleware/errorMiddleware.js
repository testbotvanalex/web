export function errorMiddleware(error, req, res, next) {
  const status = error.status || 500;
  const payload = { error: error.message || "Internal Server Error" };

  if (error.payload) {
    payload.details = error.payload;
  }

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json(payload);
}
