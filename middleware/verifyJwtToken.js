const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  /* verify if token exist */
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized Access header" });
  }

  const token = authHeader.split(" ")[1];

  /* If token exist then verify if the token is valid */
  jwt.verify(token, process.env.JWT_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).json({ message: "Unauthorized Access token" });
    }

    /* Set decoded info to request header for further verification */
    req.decoded = decoded;
    next();
  });
};
