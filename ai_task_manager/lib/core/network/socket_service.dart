import 'dart:async';
import 'dart:developer' as dev;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  IO.Socket? _socket;

  // Unique contrôleur broadcast — créé une fois, réutilisé par tous les abonnés.
  // Évite l'accumulation de listeners socket morts à chaque navigation.
  final StreamController<Map<String, dynamic>> _messageController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get messages => _messageController.stream;

  void connect(String token, String baseUrl) {
    final serverUrl = baseUrl.replaceAll('/api', '');
    dev.log('connect → $serverUrl', name: 'socket');

    _socket = IO.io(serverUrl, {
      'transports': ['websocket'],
      'auth': {'token': token},
      'autoConnect': true,
      'forceNew': true,
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

    // Un seul listener socket pour tous les messages.
    _socket!.on('new_message', (data) {
      if (data is Map) {
        final msg = Map<String, dynamic>.from(data);
        dev.log(
          '← new_message  conv=${msg['conversationId']}  from=${msg['senderName']}',
          name: 'socket',
        );
        _messageController.add(msg);
      }
    });
  }

  void disconnect() {
    dev.log('disconnect demandé', name: 'socket');
    _socket?.dispose();
    _socket = null;
  }

  void joinConversation(String convId) {
    dev.log('join  conv:$convId', name: 'socket');
    _socket?.emit('join_conversation', convId);
  }
}

final socketServiceProvider = Provider<SocketService>((ref) => SocketService());
