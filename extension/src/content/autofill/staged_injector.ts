import { DetectedField } from './field_detector';
import { CandidateProfile } from '../../shared/types';

export class StagedInjector {
  injectProfileData(
    fields: DetectedField[],
    profile: CandidateProfile,
    qaAnswers: Array<{ field_id: string; answer: string }> = []
  ): { filledCount: number; missingRequired: number } {
    let filledCount = 0;
    let missingRequired = 0;

    const links = profile.links || {};
    const fullName = profile.headline || 'Candidate'; // Profile full name
    const [firstName, ...rest] = fullName.split(' ');
    const lastName = rest.join(' ');

    fields.forEach((field) => {
      let valueToInject: string | null = null;

      switch (field.fieldType) {
        case 'first_name':
          valueToInject = firstName || null;
          break;
        case 'last_name':
          valueToInject = lastName || null;
          break;
        case 'full_name':
          valueToInject = fullName;
          break;
        case 'email':
          valueToInject = profile.user_id ? 'applicant@example.com' : null;
          break;
        case 'phone':
          valueToInject = profile.phone || null;
          break;
        case 'linkedin':
          valueToInject = links['linkedin'] || null;
          break;
        case 'github':
          valueToInject = links['github'] || null;
          break;
        case 'portfolio':
          valueToInject = links['portfolio'] || null;
          break;
        case 'question': {
          const matchAnswer = qaAnswers.find(a => 
            a.field_id === field.element.id || 
            field.label.toLowerCase().includes(a.field_id.toLowerCase())
          );
          if (matchAnswer) {
            valueToInject = matchAnswer.answer;
          }
          break;
        }
      }

      if (valueToInject) {
        this.setNativeValue(field.element, valueToInject);
        this.highlightField(field.element, 'filled');
        filledCount++;
      } else if (field.isRequired) {
        this.highlightField(field.element, 'missing');
        missingRequired++;
      }
    });

    return { filledCount, missingRequired };
  }

  private setNativeValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string): void {
    const proto = Object.getPrototypeOf(element);
    const valueSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (valueSetter) {
      valueSetter.call(element, value);
    } else {
      element.value = value;
    }

    // Trigger standard input/change events for React, Vue, Angular
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  private highlightField(element: HTMLElement, status: 'filled' | 'missing'): void {
    if (status === 'filled') {
      element.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
      element.style.borderColor = '#10B981';
      element.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.2)';
    } else {
      element.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
      element.style.borderColor = '#F59E0B';
      element.style.boxShadow = '0 0 0 2px rgba(245, 158, 11, 0.2)';
    }
  }
}

export const stagedInjector = new StagedInjector();
