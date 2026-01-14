import { io, type Socket } from 'socket.io-client';

// 1. REPLACED ENUM: Enums generate JS code. Use a const object + type instead.
export const NotificationType = {
  RESERVATION_REQUEST: 'reservation_request',
  RESERVATION_APPROVED: 'reservation_approved',
  RESERVATION_REJECTED: 'reservation_rejected',
  RESERVATION_CANCELLED: 'reservation_cancelled',
  NEW_BOOK_ADDED: 'new_book_added',
  SYSTEM_ALERT: 'system_alert'
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

// 2. INTERFACES: These are naturally erasable.
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: any;
  timestamp: Date;
  read: boolean;
}

export interface ReservationRequestData {
  userId: string;
  userName: string;
  userEmail: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  requestDate: string;
  slotNumber?: number;
  priority?: 'normal' | 'urgent';
}

export interface ReservationResponseData {
  reservationId: string;
  userId: string;
  userEmail: string;
  bookId: string;
  bookTitle: string;
  librarianName: string;
  decision: 'approved' | 'rejected';
  reason?: string;
  responseDate: string;
}

class WebSocketService {
  // 3. TYPE ANNOTATIONS: Ensure 'Socket' is imported/used as a type.
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private notificationListeners: Function[] = [];
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
    this.initializeSocket(wsUrl);
  }

  private initializeSocket(url: string) {
    try {
      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 20000
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      if (reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('notification', (notification: Notification) => {
      this.notificationListeners.forEach(listener => listener(notification));
    });

    this.socket.on('reservation_response', (response: ReservationResponseData) => {
      this.triggerListeners('reservation_response', response);
    });
  }

  public connect() {
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  public emit(event: string, data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  public off(event: string, callback?: Function) {
    if (!this.listeners.has(event)) return;
    if (callback) {
      const callbacks = this.listeners.get(event);
      const index = callbacks?.indexOf(callback);
      if (index !== undefined && index !== -1) {
        callbacks?.splice(index, 1);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  public onNotification(callback: (notification: Notification) => void) {
    this.notificationListeners.push(callback);
  }

  private triggerListeners(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  public requestReservation(data: ReservationRequestData) {
    this.emit('reservation_request', {
      ...data,
      timestamp: new Date().toISOString(),
      notificationId: `reservation_${Date.now()}`
    });
  }

  // public cleanup() {
  //   this.disconnect();
  //   this.listeners.clear();
  //   this.notificationListeners = [];
  // }
}

export const websocketService = new WebSocketService();
