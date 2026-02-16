import 'package:flutter/material.dart';
import 'package:equatable/equatable.dart';

import 'package:ai_task_manager/features/tasks/model/task_entity.dart';

class BoardColumnEntity extends Equatable {
  final String id;
  final String title;
  final TaskStatus status;
  final Color color;

  const BoardColumnEntity({
    required this.id,
    required this.title,
    required this.status,
    required this.color,
  });

  @override
  List<Object?> get props => [id, title, status, color];
}
