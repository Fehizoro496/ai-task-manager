import 'dart:async';
import 'dart:developer' as dev;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  IO.Socket? _socket;

  void connect(String token, String baseUrl) {
    final serverUrl = baseUrl.replaceAll('/api', '');
    dev.log('connect → $serverUrl', name: 'socket');

    _socket = IO.io(serverUrl, {
      'transports': ['websocket'],
      'auth': {'token': token},
      'autoConnect': true,
      'forceNew': true, // force une nouvelle instance au lieu de réutiliser le cache
    });

    _socket!.onConnect((_) {
      dev.log('✓ connecté  id=${_socket?.id}', name: 'socket');
    });

    _socket!.onDisconnect((reason) {
      dev.log('✗ déconnecté  raison=$reason', name: 'socket');
    });

    _socket!.onConnectError((err) {
      dev.log('✗ erreur connexion  err=$err', name: 'socket');
    });

    _socket!.onError((err) {
      dev.log('✗ erreur socket  err=$err', name: 'socket');
    });
  }

  void disconnect() {
    dev.log('disconnect demandé', name: 'socket');
    _socket?.dispose(); // retire le socket du cache du manager
    _socket = null;
  }

  void joinConversation(String convId) {
    dev.log('join  conv:$convId', name: 'socket');
    _socket?.emit('join_conversation', convId);
  }

  void leaveConversation(String convId) {
    dev.log('leave conv:$convId', name: 'socket');
    _socket?.emit('leave_conversation', convId);
  }

  Stream<Map<String, dynamic>> onNewMessage(String convId) {
    final controller = StreamController<Map<String, dynamic>>.broadcast();
    _socket?.on('new_message', (data) {
      if (data is Map && data['conversationId'] == convId) {
        dev.log(
          '← new_message  conv=$convId  from=${data['senderName']}',
          name: 'socket',
        );
        controller.add(Map<String, dynamic>.from(data as Map));
      }
    });
    return controller.stream;
  }

  Stream<Map<String, dynamic>> onAnyMessage() {
    final controller = StreamController<Map<String, dynamic>>.broadcast();
    _socket?.on('new_message', (data) {
      if (data is Map) {
        dev.log(
          '← new_message (any)  conv=${data['conversationId']}  from=${data['senderName']}',
          name: 'socket',
        );
        controller.add(Map<String, dynamic>.from(data as Map));
      }
    });
    return controller.stream;
  }
}

final socketServiceProvider = Provider<SocketService>((ref) => SocketService());
