import {
  ManualPaymentMethod,
  StoreOrderRecord,
  formatProductPrice,
} from '../types/store';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function generateUniqueOrderId(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(6);

  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let suffix = '';
  for (let i = 0; i < bytes.length; i++) {
    suffix += chars[bytes[i] % chars.length];
  }

  return `MKL-${yyyy}${mm}${dd}-${suffix}`;
}

export function generateSubmitSecret(): string {
  const bytes = new Uint8Array(16);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface OrderFormValidationInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
  paymentMethod: ManualPaymentMethod;
  notes?: string;
}

export function validateOrderFormInput(input: OrderFormValidationInput): {
  valid: boolean;
  error?: string;
  cleaned?: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    quantity: number;
    paymentMethod: ManualPaymentMethod;
    notes?: string;
  };
} {
  const customerName = input.customerName.trim();
  if (customerName.length < 2 || customerName.length > 120) {
    return {
      valid: false,
      error: 'Please enter your full name (2 to 120 characters).',
    };
  }

  const customerEmail = input.customerEmail.trim().toLowerCase();
  if (
    customerEmail.length < 5 ||
    customerEmail.length > 254 ||
    !EMAIL_REGEX.test(customerEmail)
  ) {
    return {
      valid: false,
      error: 'Please enter a valid email address for PDF delivery.',
    };
  }

  const customerPhone = input.customerPhone.trim();
  const phoneDigits = customerPhone.replace(/[^0-9]/g, '');
  if (
    customerPhone.length < 7 ||
    customerPhone.length > 30 ||
    phoneDigits.length < 7
  ) {
    return {
      valid: false,
      error: 'Please enter a valid phone or WhatsApp number (at least 7 digits).',
    };
  }

  const quantity = Number(input.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    return {
      valid: false,
      error: 'Quantity must be a whole number between 1 and 99.',
    };
  }

  if (
    input.paymentMethod !== 'bank_transfer' &&
    input.paymentMethod !== 'easypaisa' &&
    input.paymentMethod !== 'jazzcash' &&
    input.paymentMethod !== 'payoneer'
  ) {
    return {
      valid: false,
      error:
        'Please select a valid payment method (Bank Transfer, Easypaisa, JazzCash, or Payoneer).',
    };
  }

  const notes = (input.notes || '').trim();
  if (notes.length > 1000) {
    return {
      valid: false,
      error: 'Order notes cannot exceed 1,000 characters.',
    };
  }

  return {
    valid: true,
    cleaned: {
      customerName,
      customerEmail,
      customerPhone,
      quantity,
      paymentMethod: input.paymentMethod,
      notes: notes || undefined,
    },
  };
}

export function validatePayoneerRequestLink(rawUrl: string): {
  valid: boolean;
  cleaned?: string;
  error?: string;
} {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Please paste a valid Payoneer Payment Request Link (https://...).',
    };
  }
  if (trimmed.length > 500) {
    return {
      valid: false,
      error: 'Payment Request Link cannot exceed 500 characters.',
    };
  }
  if (!trimmed.startsWith('https://')) {
    return {
      valid: false,
      error: 'Payment Request Link must start with https://.',
    };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' || !parsed.hostname) {
      return {
        valid: false,
        error: 'Please enter a valid HTTPS payment link.',
      };
    }
  } catch {
    return {
      valid: false,
      error: 'The entered Payment Request Link is not a valid URL.',
    };
  }
  return { valid: true, cleaned: trimmed };
}

export function isSafeExternalHttpsUrl(rawUrl?: string): boolean {
  if (!rawUrl) return false;
  return validatePayoneerRequestLink(rawUrl).valid;
}

export function formatPaymentMethodLabel(method: ManualPaymentMethod): string {
  switch (method) {
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'easypaisa':
      return 'Easypaisa';
    case 'jazzcash':
      return 'JazzCash';
    case 'payoneer':
      return 'Payoneer';
  }
}

export function formatOrderSummaryForCopy(order: StoreOrderRecord): string {
  const lines = [
    `Order ID: ${order.id}`,
    `Date: ${new Date(order.createdAt).toLocaleString()}`,
    `Product: ${order.productName}`,
    `Quantity: ${order.quantity}`,
    `Total Amount: ${formatProductPrice(order.totalAmount, order.currency)}`,
    `Customer Name: ${order.customerName}`,
    `Customer Email: ${order.customerEmail}`,
    `Customer Phone: ${order.customerPhone}`,
    `Payment Method: ${formatPaymentMethodLabel(order.paymentMethod)}`,
    `Payment Status: ${order.paymentStatus}`,
    `Delivery Status: ${order.deliveryStatus}`,
  ];

  if (order.paymentRequestLink) {
    lines.push(`Payoneer Payment Request Link: ${order.paymentRequestLink}`);
  }
  if (order.paymentReference) {
    lines.push(`Payment Reference: ${order.paymentReference}`);
  }
  if (order.notes) {
    lines.push(`Customer Notes: ${order.notes}`);
  }

  return lines.join('\n');
}

export function buildSuggestedPayoneerRequestEmail(
  order: StoreOrderRecord,
  paymentRequestLink?: string
): {
  subject: string;
  body: string;
  gmailComposeUrl: string;
} {
  const link = (paymentRequestLink || order.paymentRequestLink || '').trim();
  const subject = `Payoneer Payment Request for Your MK Labs Order (${order.id})`;
  const body = [
    `Hello ${order.customerName},`,
    '',
    `Thank you for your order with MK Labs Digital Store!`,
    '',
    `Here are your order details:`,
    `• Order ID: ${order.id}`,
    `• Product: ${order.productName}`,
    `• Quantity: ${order.quantity}`,
    `• Total Amount: ${formatProductPrice(order.totalAmount, order.currency)}`,
    '',
    link
      ? `Please complete your payment using this Payoneer Payment Request Link:\n${link}`
      : `Please complete the Payoneer payment request sent to this email address.`,
    '',
    `Once we verify your payment in Payoneer, we will manually email your digital PDF product to ${order.customerEmail}.`,
    '',
    `Best regards,`,
    `MK Labs Digital Store`,
  ].join('\n');

  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    order.customerEmail
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return {
    subject,
    body,
    gmailComposeUrl,
  };
}

export function buildSuggestedDeliveryEmail(
  order: StoreOrderRecord,
  localPdfFilename?: string
): {
  subject: string;
  body: string;
  gmailComposeUrl: string;
} {
  const subject = `Your MK Labs Digital Product: ${order.productName} (Order ${order.id})`;
  const attachmentHint = localPdfFilename
    ? ` (${localPdfFilename})`
    : '';
  const body = [
    `Hello ${order.customerName},`,
    '',
    `Thank you for your order with MK Labs Digital Store!`,
    '',
    `Your payment for Order ${order.id} has been verified. Please find your digital product attached to this email${attachmentHint}:`,
    '',
    `• Order ID: ${order.id}`,
    `• Product: ${order.productName}`,
    `• Quantity: ${order.quantity}`,
    `• Amount Paid: ${formatProductPrice(order.totalAmount, order.currency)}`,
    '',
    `Please reply directly to this email if you have any questions or need assistance opening the PDF file.`,
    '',
    `Best regards,`,
    `MK Labs Digital Store`,
  ].join('\n');

  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    order.customerEmail
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return {
    subject,
    body,
    gmailComposeUrl,
  };
}
