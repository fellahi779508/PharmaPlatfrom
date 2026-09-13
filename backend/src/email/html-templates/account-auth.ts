export const accountAuthTemplate = (otp: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e293b; text-align: center; margin-bottom: 8px;">Authorization Code</h2>
      <p style="color: #475569; text-align: center;">Use the code below to access your account:</p>
      <div style="text-align: center; margin: 28px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb; background: #eff6ff; padding: 12px 24px; border-radius: 6px; border: 1px dashed #bfdbfe;">
          ${otp}
        </span>
      </div>
      <p style="color: #64748b; font-size: 13px; text-align: center;">This code expires in <strong>1 minute</strong>.</p>
    </div>
  `;
};
