import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';
import { UserService } from '../user.service';

export interface AiToolResult {
  toolName: string;
  status: string; // 'success' | 'error' | 'pending_confirmation'
  displayType: string; // 'customer_card' | 'pledge_card' | 'inventory_card' | 'confirmation' | 'dashboard_card' | 'text' | 'navigation'
  data: any;
  summary: string;
}

export interface AiConfirmation {
  confirmationId: string;
  action: string;
  description: string;
  parameters: any;
  details: any;
}

export interface AiChatResponse {
  message: string;
  type: string; // 'text' | 'tool_result' | 'confirmation_required' | 'error' | 'navigation'
  toolResults?: AiToolResult[];
  pendingConfirmation?: AiConfirmation;
  navigateTo?: string;
  navigationData?: any;
  structuredData?: any[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
  image?: string;
  response?: AiChatResponse;
  loading?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private sessionId = 'session_' + Math.random().toString(36).substring(2, 9);
  private conversationHistory: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  private messagesSubject = new BehaviorSubject<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your JewelBankers AI Assistant. How can I help you today? You can ask me to search customers, check open pledges, calculate redemption, check gold rates, or create estimates.',
      timestamp: new Date()
    }
  ]);
  public messages$ = this.messagesSubject.asObservable();

  private isOpenSubject = new BehaviorSubject<boolean>(false);
  public isOpen$ = this.isOpenSubject.asObservable();

  private isListeningSubject = new BehaviorSubject<boolean>(false);
  public isListening$ = this.isListeningSubject.asObservable();

  private isProcessingSubject = new BehaviorSubject<boolean>(false);
  public isProcessing$ = this.isProcessingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private userService: UserService
  ) {}

  private get aiApiUrl(): string {
    return this.userService.apiUrl + 'ai/';
  }

  public toggleOpen(): void {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }

  public setOpen(open: boolean): void {
    this.isOpenSubject.next(open);
  }

  public setListening(listening: boolean): void {
    this.isListeningSubject.next(listening);
  }

  public clearMessages(): void {
    this.conversationHistory = [];
    this.messagesSubject.next([
      {
        id: 'welcome_' + Date.now(),
        sender: 'assistant',
        text: 'Conversation cleared. How can I help you today?',
        timestamp: new Date()
      }
    ]);
  }

  public sendMessage(text: string, imageBase64?: string, mimeType?: string): Observable<AiChatResponse> {
    const userMsgId = 'msg_' + Date.now();
    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: text,
      image: imageBase64 ? `data:${mimeType || 'image/jpeg'};base64,${imageBase64}` : undefined,
      timestamp: new Date()
    };

    const currentMessages = this.messagesSubject.value;
    const assistantLoadingMsg: ChatMessage = {
      id: 'loading_' + Date.now(),
      sender: 'assistant',
      text: 'Thinking...',
      timestamp: new Date(),
      loading: true
    };

    this.messagesSubject.next([...currentMessages, userMessage, assistantLoadingMsg]);
    this.isProcessingSubject.next(true);

    const payload = {
      message: text,
      sessionId: this.sessionId,
      imageBase64: imageBase64,
      mimeType: mimeType || (imageBase64 ? 'image/jpeg' : undefined),
      conversationHistory: this.conversationHistory
    };

    return this.http.post<AiChatResponse>(`${this.aiApiUrl}chat`, payload).pipe(
      tap((resp) => {
        this.isProcessingSubject.next(false);
        // Track history
        this.conversationHistory.push({
          role: 'user',
          parts: [{ text: text || 'Analyze this image' }]
        });
        this.conversationHistory.push({
          role: 'model',
          parts: [{ text: resp.message || 'Processed.' }]
        });
        if (this.conversationHistory.length > 20) {
          this.conversationHistory = this.conversationHistory.slice(-20);
        }

        // Replace loading message with actual response
        const updated = this.messagesSubject.value.filter(m => m.id !== assistantLoadingMsg.id);
        const assistantMsg: ChatMessage = {
          id: 'resp_' + Date.now(),
          sender: 'assistant',
          text: resp.message || 'Operation processed.',
          timestamp: new Date(),
          response: resp
        };
        this.messagesSubject.next([...updated, assistantMsg]);
      }),
      catchError((err) => {
        this.isProcessingSubject.next(false);
        const updated = this.messagesSubject.value.filter(m => m.id !== assistantLoadingMsg.id);
        const errorMsg: ChatMessage = {
          id: 'err_' + Date.now(),
          sender: 'assistant',
          text: 'Sorry, an error occurred while connecting to the AI assistant: ' + (err.error?.message || err.message || 'Service unavailable'),
          timestamp: new Date()
        };
        this.messagesSubject.next([...updated, errorMsg]);
        return throwError(() => err);
      })
    );
  }

  public confirmAction(confirmationId: string): Observable<AiChatResponse> {
    this.isProcessingSubject.next(true);
    return this.http.post<AiChatResponse>(`${this.aiApiUrl}confirm`, { confirmationId }).pipe(
      tap((resp) => {
        this.isProcessingSubject.next(false);
        const current = this.messagesSubject.value;
        const confirmedMsg: ChatMessage = {
          id: 'confirmed_' + Date.now(),
          sender: 'assistant',
          text: resp.message || 'Operation successfully executed.',
          timestamp: new Date(),
          response: resp
        };
        this.messagesSubject.next([...current, confirmedMsg]);
      }),
      catchError((err) => {
        this.isProcessingSubject.next(false);
        return throwError(() => err);
      })
    );
  }

  public searchCustomersFuzzy(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.userService.apiUrl}customers/fuzzy`, {
      params: { query }
    });
  }

  public getHealth(): Observable<any> {
    return this.http.get<any>(`${this.aiApiUrl}health`);
  }

  public getTools(): Observable<any[]> {
    return this.http.get<any[]>(`${this.aiApiUrl}tools`);
  }
}
