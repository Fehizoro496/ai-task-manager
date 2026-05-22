const asyncHandler = require("../../utils/asyncHandler");
const calendarService = require("./calendar.service");

const listEvents = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const events = await calendarService.listEvents(
    req.user.id,
    isAdmin,
    req.query.from,
    req.query.to,
  );
  res.json({ events });
});

module.exports = { listEvents };
