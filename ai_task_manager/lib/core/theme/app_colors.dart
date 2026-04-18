import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ── Primary — Apple Blue ──────────────────────────────────────────────────
  static const Color primary       = Color(0xFF0071E3); // Apple Blue (CTAs, interactive)
  static const Color primaryLight  = Color(0xFF2997FF); // Links on dark backgrounds
  static const Color primaryDark   = Color(0xFF0066CC); // Links on light backgrounds
  static const Color primarySurface= Color(0xFFE8F4FF); // Very light blue tint

  // ── Accent (secondary interactive) ───────────────────────────────────────
  static const Color accent        = Color(0xFF2997FF);

  // ── Semantic ──────────────────────────────────────────────────────────────
  static const Color success = Color(0xFF34C759); // Apple green
  static const Color warning = Color(0xFFFF9500); // Apple orange
  static const Color error   = Color(0xFFFF3B30); // Apple red
  static const Color info    = Color(0xFF5AC8FA); // Apple sky blue

  // ── Neutrals · Light ─────────────────────────────────────────────────────
  static const Color backgroundLight  = Color(0xFFF5F5F7); // Apple light gray
  static const Color surfaceLight     = Color(0xFFFFFFFF);
  static const Color cardLight        = Color(0xFFFFFFFF);
  static const Color borderLight      = Color(0xFFD2D2D7); // subtle Apple border
  static const Color dividerLight     = Color(0xFFE5E5EA);
  static const Color textPrimaryLight = Color(0xFF1D1D1F); // Apple near-black
  static const Color textSecondaryLight = Color(0xFF3A3A3C); // ~80% black
  static const Color textTertiaryLight  = Color(0xFF6E6E73); // ~48% black
  static const Color hoverLight       = Color(0xFFEDEDF2); // Apple button-active

  // ── Neutrals · Dark ──────────────────────────────────────────────────────
  static const Color backgroundDark   = Color(0xFF000000); // Apple pure black
  static const Color surfaceDark      = Color(0xFF1D1D1F); // Apple near-black surface
  static const Color cardDark         = Color(0xFF272729); // Apple dark card
  static const Color borderDark       = Color(0xFF3A3A3C);
  static const Color dividerDark      = Color(0xFF2C2C2E);
  static const Color textPrimaryDark  = Color(0xFFFFFFFF);
  static const Color textSecondaryDark = Color(0xFFAEAEB2);
  static const Color textTertiaryDark  = Color(0xFF636366);
  static const Color hoverDark        = Color(0xFF2C2C2E);

  // ── Kanban status ─────────────────────────────────────────────────────────
  static const Color kanbanTodo       = Color(0xFF8E8E93); // gray
  static const Color kanbanInProgress = Color(0xFF0071E3); // Apple Blue
  static const Color kanbanReview     = Color(0xFFFF9500); // Apple orange
  static const Color kanbanDone       = Color(0xFF34C759); // Apple green

  // ── Priority ──────────────────────────────────────────────────────────────
  static const Color priorityUrgent = Color(0xFFFF3B30); // Apple red
  static const Color priorityHigh   = Color(0xFFFF9500); // Apple orange
  static const Color priorityMedium = Color(0xFF0071E3); // Apple Blue
  static const Color priorityLow    = Color(0xFF8E8E93); // Apple gray
}
