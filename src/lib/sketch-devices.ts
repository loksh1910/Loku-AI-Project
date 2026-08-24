export type SketchDeviceCategory = "Mobile" | "Desktop" | "Tablet" | "Watch" | "Paper";

export type SketchDevice = {
  label: string;
  width: number;
  height: number;
};

export const DEVICE_CATALOG: Record<SketchDeviceCategory, SketchDevice[]> = {
  Mobile: [
    { label: "iPhone 17", width: 402, height: 874 },
    { label: "iPhone 16 & 17 Pro", width: 402, height: 874 },
    { label: "iPhone 16 & 17 Pro Max", width: 440, height: 956 },
    { label: "iPhone 16", width: 393, height: 852 },
    { label: "iPhone 16 Plus", width: 430, height: 932 },
    { label: "iPhone Air", width: 402, height: 874 },
    { label: "iPhone 14 & 15 Pro Max", width: 430, height: 932 },
    { label: "iPhone 14 & 15 Pro", width: 393, height: 852 },
    { label: "iPhone 13 & 14", width: 390, height: 844 },
    { label: "iPhone 14 Plus", width: 428, height: 926 },
    { label: "Android Compact", width: 360, height: 800 },
    { label: "Android Medium", width: 412, height: 892 },
  ],
  Desktop: [
    { label: "Desktop 1440", width: 1440, height: 1024 },
    { label: "Desktop 1920", width: 1920, height: 1080 },
    { label: "MacBook Air", width: 1280, height: 832 },
  ],
  Tablet: [
    { label: "iPad Mini", width: 744, height: 1133 },
    { label: "iPad Air", width: 820, height: 1180 },
    { label: "iPad Pro 11\"", width: 834, height: 1194 },
  ],
  Watch: [
    { label: "Apple Watch 41mm", width: 176, height: 215 },
    { label: "Apple Watch 45mm", width: 198, height: 242 },
  ],
  Paper: [
    { label: "A4", width: 794, height: 1123 },
    { label: "Letter", width: 816, height: 1056 },
  ],
};

export const DEVICE_CATEGORIES: SketchDeviceCategory[] = [
  "Mobile",
  "Desktop",
  "Tablet",
  "Watch",
  "Paper",
];
