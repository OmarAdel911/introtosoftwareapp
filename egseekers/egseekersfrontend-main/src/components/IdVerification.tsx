interface IdVerificationProps {
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED' | string;
  onVerify?: () => void;
}

export function IdVerification({ status = 'PENDING', onVerify }: IdVerificationProps) {
  // ... existing code ...
} 