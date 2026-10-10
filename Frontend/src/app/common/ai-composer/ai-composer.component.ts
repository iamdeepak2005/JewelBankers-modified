import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { AiService, ChatMessage, AiToolResult, AiConfirmation, AiChatResponse } from '../../services/ai.service';

declare let webkitSpeechRecognition: any;
declare let SpeechRecognition: any;

@Component({
  selector: 'app-ai-composer',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule],
  templateUrl: './ai-composer.component.html',
  styleUrls: ['./ai-composer.component.css']
})
export class AiComposerComponent implements OnInit, OnDestroy {
  @ViewChild('chatScroll') private chatScrollContainer!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  isOpen = false;
  inputText = '';
  isListening = false;
  isProcessing = false;
  messages: ChatMessage[] = [];
  selectedImageBase64: string | null = null;
  selectedImageMimeType: string | null = null;
  selectedImagePreview: string | null = null;

  recognition: any = null;
  private subscriptions: Subscription = new Subscription();

  // Suggestion chips
  suggestionChips = [
    { label: "Today's summary", prompt: "Show today's business summary" },
    { label: "Today's gold rate", prompt: "What is the current gold rate?" },
    { label: "Search customers", prompt: "Search customers named " },
    { label: "Check open pledges", prompt: "Search open pledges for " },
    { label: "Open Jewellery POS", prompt: "Navigate to jewellery POS billing" }
  ];

  constructor(
    public aiService: AiService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.aiService.isOpen$.subscribe(open => {
        this.isOpen = open;
        if (open) {
          setTimeout(() => this.scrollToBottom(), 150);
        }
      })
    );

    this.subscriptions.add(
      this.aiService.messages$.subscribe(msgs => {
        this.messages = msgs;
        setTimeout(() => this.scrollToBottom(), 100);
      })
    );

    this.subscriptions.add(
      this.aiService.isProcessing$.subscribe(proc => {
        this.isProcessing = proc;
      })
    );

    this.initSpeechRecognition();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }
  }

  toggleDrawer(): void {
    this.aiService.toggleOpen();
  }

  closeDrawer(): void {
    this.aiService.setOpen(false);
  }

  clearChat(): void {
    this.aiService.clearMessages();
  }

  useSuggestion(prompt: string): void {
    if (prompt.endsWith(' ')) {
      this.inputText = prompt;
      if (!this.isOpen) this.aiService.setOpen(true);
    } else {
      this.inputText = prompt;
      this.sendMessage();
    }
  }

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text && !this.selectedImageBase64) return;

    if (!this.isOpen) {
      this.aiService.setOpen(true);
    }

    const imgBase64 = this.selectedImageBase64 || undefined;
    const mimeType = this.selectedImageMimeType || undefined;

    // Clear composer input
    this.inputText = '';
    this.clearSelectedImage();

    this.aiService.sendMessage(text, imgBase64, mimeType).subscribe({
      next: (response: AiChatResponse) => {
        // Check for navigation instruction
        let navRoute = response.navigateTo;
        let navData: any = response.navigationData ? { ...response.navigationData } : {};

        if (response.toolResults && response.toolResults.length > 0) {
          for (const tr of response.toolResults) {
            if (tr.displayType === 'navigation' && tr.data) {
              if (!navRoute && tr.data.route) {
                navRoute = tr.data.route;
              }
              navData = { ...navData, ...tr.data };
            }
          }
        }

        if (navRoute) {
          this.handleNavigation(navRoute, navData);
        }
      },
      error: (err) => {
        console.error('AI chat error:', err);
      }
    });
  }

  confirmAction(confirmationId: string): void {
    this.aiService.confirmAction(confirmationId).subscribe({
      next: (resp) => {
        this.snackBar.open('Action executed successfully!', 'OK', { duration: 3500 });
      },
      error: (err) => {
        this.snackBar.open('Failed to execute: ' + (err.error?.message || err.message), 'Dismiss', { duration: 4000 });
      }
    });
  }

  handleNavigation(route: string, data?: any): void {
    if (!route) return;
    let target = route.trim();
    if (!target.startsWith('/')) target = '/' + target;

    const navigationExtras = data ? { state: { ...data, aiAutoFilled: true } } : undefined;
    this.router.navigate([target], navigationExtras);
    this.snackBar.open(`Navigated to ${target}`, 'OK', { duration: 2500 });
  }

  // ==================== SPEECH RECOGNITION ====================
  private initSpeechRecognition(): void {
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechAPI) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    this.recognition = new SpeechAPI();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-IN'; // Indian English / localized accent

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        this.inputText = (this.inputText ? this.inputText + ' ' : '') + finalTranscript;
        this.stopListening();
        // Auto send voice command after a brief pause
        setTimeout(() => {
          if (this.inputText.trim()) {
            this.sendMessage();
          }
        }, 500);
      } else if (interimTranscript) {
        this.inputText = interimTranscript;
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      this.stopListening();
      if (event.error !== 'no-speech') {
        this.snackBar.open('Voice recognition error: ' + event.error, 'Close', { duration: 2500 });
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.aiService.setListening(false);
    };
  }

  toggleListening(): void {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  startListening(): void {
    if (!this.recognition) {
      this.snackBar.open('Speech recognition is not available in your browser.', 'Close', { duration: 3000 });
      return;
    }
    try {
      this.isListening = true;
      this.aiService.setListening(true);
      this.recognition.start();
      this.snackBar.open('Listening... speak now', '', { duration: 2000 });
    } catch (e) {
      console.error('Error starting speech:', e);
      this.isListening = false;
      this.aiService.setListening(false);
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      try { this.recognition.stop(); } catch (e) {}
    }
    this.isListening = false;
    this.aiService.setListening(false);
  }

  // ==================== CAMERA / FILE UPLOAD ====================
  triggerFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.processImageFile(file);
    }
  }

  processImageFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Please select a valid image file', 'Close', { duration: 3000 });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.selectedImagePreview = dataUrl;
      this.selectedImageMimeType = file.type;
      // Extract base64 without header
      const commaIdx = dataUrl.indexOf(',');
      if (commaIdx >= 0) {
        this.selectedImageBase64 = dataUrl.substring(commaIdx + 1);
      }
      if (!this.isOpen) {
        this.aiService.setOpen(true);
      }
    };
    reader.readAsDataURL(file);
  }

  clearSelectedImage(): void {
    this.selectedImageBase64 = null;
    this.selectedImageMimeType = null;
    this.selectedImagePreview = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.chatScrollContainer) {
        this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  // Key listener for Enter key in input
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
