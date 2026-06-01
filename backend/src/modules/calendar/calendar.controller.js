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

const createEvent = asyncHandler(async (req, res) => {
  const event = await calendarService.createEvent(req.user.id, req.body ?? {});
  res.status(201).json({ event });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const result = await calendarService.deleteEvent(
    req.params.id,
    req.user.id,
    isAdmin,
  );
  res.json(result);
});

module.exports = { listEvents, createEvent, deleteEvent };
