const asyncHandler = require("../../utils/asyncHandler");
const reportsService = require("./reports.service");

const overview = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const data = await reportsService.overview(req.user.id, isAdmin, {
    unit: req.query.unit,
    anchor: req.query.anchor,
  });
  res.json(data);
});

module.exports = { overview };
