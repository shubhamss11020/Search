export interface DetectedField {
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  fieldType: string; // 'first_name', 'last_name', 'full_name', 'email', 'phone', 'linkedin', 'github', 'portfolio', 'question'
  label: string;
  isRequired: boolean;
  maxChars?: number;
}

export class FieldDetector {
  findFormFields(): DetectedField[] {
    const fields: DetectedField[] = [];
    const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), textarea, select'
    );

    inputs.forEach((el) => {
      // Ignore hidden or disabled elements
      const isReadOnly = 'readOnly' in el && (el as HTMLInputElement | HTMLTextAreaElement).readOnly;
      if (el.offsetParent === null || el.disabled || isReadOnly) return;

      const label = this.resolveLabel(el);
      const fieldType = this.classifyField(el, label);
      const isRequired = el.required || el.getAttribute('aria-required') === 'true' || label.includes('*');
      const maxChars = ('maxLength' in el && (el as HTMLInputElement).maxLength > 0) 
        ? (el as HTMLInputElement).maxLength 
        : undefined;

      fields.push({
        element: el,
        fieldType,
        label,
        isRequired,
        maxChars
      });
    });

    return fields;
  }

  private resolveLabel(el: HTMLElement): string {
    // 1. Check aria-label
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label')!;

    // 2. Check linked <label for="id">
    if (el.id) {
      const labelEl = document.querySelector(`label[for="${el.id}"]`);
      if (labelEl) return labelEl.textContent?.trim() || '';
    }

    // 3. Check parent label
    const parentLabel = el.closest('label');
    if (parentLabel) return parentLabel.textContent?.trim() || '';

    // 4. Check placeholder or name
    if ('placeholder' in el && (el as HTMLInputElement).placeholder) return (el as HTMLInputElement).placeholder;
    if (el.getAttribute('name')) return el.getAttribute('name') || '';

    return '';
  }

  private classifyField(el: HTMLElement, label: string): string {
    const combined = `${label} ${el.getAttribute('name') || ''} ${el.getAttribute('id') || ''} ${el.getAttribute('autocomplete') || ''}`.toLowerCase();

    if (combined.includes('first name') || combined.includes('given name') || combined.includes('fname')) return 'first_name';
    if (combined.includes('last name') || combined.includes('family name') || combined.includes('surname') || combined.includes('lname')) return 'last_name';
    if (combined.includes('full name') || combined.includes('candidate name') || combined.includes('your name')) return 'full_name';
    if (combined.includes('email') || (el as HTMLInputElement).type === 'email') return 'email';
    if (combined.includes('phone') || combined.includes('mobile') || (el as HTMLInputElement).type === 'tel') return 'phone';
    if (combined.includes('linkedin')) return 'linkedin';
    if (combined.includes('github')) return 'github';
    if (combined.includes('portfolio') || combined.includes('website')) return 'portfolio';

    // If textarea or long question text
    if (el.tagName.toLowerCase() === 'textarea' || label.length > 25) {
      return 'question';
    }

    return 'unknown';
  }
}

export const fieldDetector = new FieldDetector();
