import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Typography system inspired by Apple's SF Pro principles:
/// — Negative letter-spacing at every size (not just headlines)
/// — Tight line-heights for display (1.07–1.14), open for body (1.47)
/// — Weight restraint: 400 for body, 600 for emphasis, 700 only for rare bold moments
/// — Uses Inter as the closest variable-weight substitute for SF Pro
class AppTypography {
  AppTypography._();

  static TextTheme get textTheme => TextTheme(
        // ── Display ──────────────────────────────────────────────────────────
        displayLarge: GoogleFonts.inter(
          fontSize: 40,
          fontWeight: FontWeight.w600,
          letterSpacing: -1.5,
          height: 1.07,
        ),
        displayMedium: GoogleFonts.inter(
          fontSize: 32,
          fontWeight: FontWeight.w600,
          letterSpacing: -1.0,
          height: 1.10,
        ),
        displaySmall: GoogleFonts.inter(
          fontSize: 28,
          fontWeight: FontWeight.w400,
          letterSpacing: -0.56, // ~0.196px at this scale
          height: 1.14,
        ),
        // ── Headline ─────────────────────────────────────────────────────────
        headlineLarge: GoogleFonts.inter(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.374,
          height: 1.19,
        ),
        headlineMedium: GoogleFonts.inter(
          fontSize: 21,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.3,
          height: 1.19,
        ),
        headlineSmall: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.224,
          height: 1.24,
        ),
        // ── Title ────────────────────────────────────────────────────────────
        titleLarge: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.2,
          height: 1.40,
        ),
        titleMedium: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.224,
          height: 1.43,
        ),
        titleSmall: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          letterSpacing: -0.15,
          height: 1.40,
        ),
        // ── Body ─────────────────────────────────────────────────────────────
        bodyLarge: GoogleFonts.inter(
          fontSize: 17,
          fontWeight: FontWeight.w400,
          letterSpacing: -0.374,
          height: 1.47,
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          letterSpacing: -0.224,
          height: 1.47,
        ),
        bodySmall: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w400,
          letterSpacing: -0.12,
          height: 1.33,
        ),
        // ── Label ────────────────────────────────────────────────────────────
        labelLarge: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          letterSpacing: -0.15,
          height: 1.40,
        ),
        labelMedium: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          letterSpacing: -0.12,
          height: 1.33,
        ),
        labelSmall: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          letterSpacing: -0.08,
          height: 1.40,
        ),
      );
}
