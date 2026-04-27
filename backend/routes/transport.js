const express = require("express");
const router = express.Router();

// ── Transport Routes ─────────────────────────────────────────────────────────
// NOTE: All endpoints are stubs. Full implementation is pending.

router.get("/routes", (req, res) => {
  res.json({ success: true, data: [], message: "Transport routes — not yet implemented" });
});

router.post("/routes", (req, res) => {
  res.status(501).json({ success: false, message: "Create transport route — not yet implemented" });
});

router.put("/routes/:id", (req, res) => {
  res.status(501).json({ success: false, message: "Update transport route — not yet implemented" });
});

router.delete("/routes/:id", (req, res) => {
  res.status(501).json({ success: false, message: "Delete transport route — not yet implemented" });
});

// ── Transport Trips ──────────────────────────────────────────────────────────

router.get("/trips", (req, res) => {
  res.json({ success: true, data: [], message: "Transport trips — not yet implemented" });
});

router.post("/trips", (req, res) => {
  res.status(501).json({ success: false, message: "Create transport trip — not yet implemented" });
});

router.put("/trips/:id", (req, res) => {
  res.status(501).json({ success: false, message: "Update transport trip — not yet implemented" });
});

router.delete("/trips/:id", (req, res) => {
  res.status(501).json({ success: false, message: "Delete transport trip — not yet implemented" });
});

// ── Vehicle Assignments ──────────────────────────────────────────────────────

router.get("/assignments", (req, res) => {
  res.json({ success: true, data: [], message: "Vehicle assignments — not yet implemented" });
});

router.post("/assignments", (req, res) => {
  res.status(501).json({ success: false, message: "Create vehicle assignment — not yet implemented" });
});

router.delete("/assignments/:id", (req, res) => {
  res.status(501).json({ success: false, message: "Delete vehicle assignment — not yet implemented" });
});

// ── Schedule ─────────────────────────────────────────────────────────────────

router.get("/schedule", (req, res) => {
  res.json({ success: true, data: [], message: "Transport schedule — not yet implemented" });
});

module.exports = router;
