import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:ai_task_manager/core/database/app_database.dart';
import 'package:ai_task_manager/core/network/api_client.dart';
import 'package:ai_task_manager/core/network/api_config.dart';

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError(
    'sharedPreferencesProvider must be overridden in the root ProviderScope.',
  );
});

final appDatabaseProvider = Provider<AppDatabase>((ref) {
  return AppDatabase();
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return ApiClient(baseUrl: ApiConfig.baseUrl, prefs: prefs);
});

final themeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.system);
